// Sends the e-mail reminders (calendar events + festival reminders).
//
// dispatchAll() is idempotent and cheap, so it can be triggered from several
// places without double-sending:
//   • an in-process timer (startReminderScheduler) on a normal Node server
//   • POST/GET /api/calendar/reminders/dispatch for external schedulers
//     (Vercel Cron, cron-job.org, ...) — serverless hosts can't keep a timer alive.
// Each reminder is "claimed" in the DB (last_reminded_for / last_sent_for)
// before the e-mail goes out, so two overlapping runs never send twice.
const pool = require('../config/db');
const emailService = require('./emailService');
const { ensureTables } = require('./calendarEventsService');
const { calendarLabel, festivalsOnDate } = require('./festivalRemindersService');
const { addDays, diffDays, occurrencesBetween, reminderInstant, zonedToUtc } = require('../utils/eventRecurrence');

const LATE_GRACE_MS = 6 * 3600 * 1000;   // don't send an event reminder >6h after the event started
const FESTIVAL_SEND_HOUR_IST = 7;        // festival reminders go out from 07:00 IST
const IST_MS = 5.5 * 3600000;

const istDay = (d) => new Date(d.getTime() + IST_MS).toISOString().slice(0, 10);
const istHour = (d) => { const x = new Date(d.getTime() + IST_MS); return x.getUTCHours() + x.getUTCMinutes() / 60; };

function whenLabel(ev, occDay) {
    if (ev.all_day || !ev.start_time) {
        return new Intl.DateTimeFormat('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
        }).format(new Date(occDay + 'T00:00:00Z')) + ' (all day)';
    }
    return new Intl.DateTimeFormat('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZone: ev.timezone, timeZoneName: 'short',
    }).format(zonedToUtc(occDay, ev.start_time, ev.timezone));
}

const dateLabel = (day) => new Intl.DateTimeFormat('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
}).format(new Date(day + 'T00:00:00Z'));

// ─── Event reminders ────────────────────────────────────────────────────────
async function dispatchEventReminders({ now = new Date(), mailer = emailService } = {}) {
    await ensureTables();
    const { rows } = await pool.query(
        `SELECT e.id, e.title, e.event_type, e.description, e.location, e.start_date::text, e.start_time::text,
                e.all_day, e.timezone, e.recurrence, e.reminder_minutes, e.last_reminded_for::text,
                u.email, u.full_name
         FROM user_calendar_events e JOIN users u ON u.id = e.user_id
         WHERE e.source = 'local' AND e.reminder_minutes IS NOT NULL
           AND NOT (e.event_type = 'task' AND e.completed)
           AND (e.recurrence <> 'none'
                OR (e.start_date BETWEEN ($1::date - 2) AND ($1::date + 10)))`,
        [now.toISOString().slice(0, 10)]);

    const today = now.toISOString().slice(0, 10);
    let sent = 0, failed = 0;

    for (const e of rows) {
        const start_time = e.start_time ? e.start_time.slice(0, 5) : null;
        const occs = occurrencesBetween(e.start_date, e.recurrence, addDays(today, -2), addDays(today, 9));
        let due = null;
        for (const occ of occs) {
            const at = reminderInstant(occ, start_time, e.all_day, e.reminder_minutes, e.timezone);
            const startMs = zonedToUtc(occ, e.all_day || !start_time ? '00:00' : start_time, e.timezone).getTime();
            if (at <= now && now.getTime() <= startMs + LATE_GRACE_MS + (e.all_day ? 24 * 3600000 : 0)
                && (!e.last_reminded_for || occ > e.last_reminded_for)) {
                due = occ;
            }
        }
        if (!due) continue;

        const claim = await pool.query(
            `UPDATE user_calendar_events SET last_reminded_for = $2
             WHERE id = $1 AND (last_reminded_for IS NULL OR last_reminded_for < $2) RETURNING id`,
            [e.id, due]);
        if (!claim.rowCount) continue; // another run got it

        try {
            await mailer.sendEventReminderEmail(e.email, e.full_name, {
                title: e.title, event_type: e.event_type, location: e.location,
                description: e.description, whenLabel: whenLabel({ ...e, start_time }, due),
            });
            sent++;
        } catch (err) {
            failed++;
            console.error(`Reminder e-mail failed (event ${e.id}):`, err.message);
            await pool.query(
                `UPDATE user_calendar_events SET last_reminded_for = $3 WHERE id = $1 AND last_reminded_for = $2`,
                [e.id, due, e.last_reminded_for || null]);
        }
    }
    return { sent, failed };
}

// ─── Festival reminders ─────────────────────────────────────────────────────
async function dispatchFestivalReminders({ now = new Date(), mailer = emailService, lookup = festivalsOnDate } = {}) {
    await ensureTables();
    if (istHour(now) < FESTIVAL_SEND_HOUR_IST) return { sent: 0, failed: 0 };

    const todayIST = istDay(now);
    const { rows } = await pool.query(
        `SELECT r.id, r.user_id, r.tradition, r.festival_name, r.festival_date::text, r.days_before,
                r.last_sent_for::text, u.email, u.full_name
         FROM user_festival_reminders r JOIN users u ON u.id = r.user_id
         WHERE (r.festival_name IS NULL
                OR (r.festival_date >= $1::date AND r.festival_date - r.days_before <= $1::date))
         ORDER BY (r.festival_name IS NOT NULL), r.id`, [todayIST]);

    const cache = new Map();
    const cachedLookup = async (cal, day) => {
        const k = `${cal}:${day}`;
        if (!cache.has(k)) cache.set(k, lookup(cal, day).catch((err) => {
            console.error(`Festival lookup failed (${k}):`, err.message); return [];
        }));
        return cache.get(k);
    };

    const covered = new Set(); // user:calendar:date already mailed via an "all festivals" reminder in this run
    let sent = 0, failed = 0;

    for (const r of rows) {
        let target, festivals, claimSql, claimArgs;

        if (r.festival_name == null) {
            target = addDays(todayIST, r.days_before);
            if (r.last_sent_for && r.last_sent_for >= target) continue;
            festivals = await cachedLookup(r.tradition, target);
            if (!festivals.length) continue;
            claimSql = `UPDATE user_festival_reminders SET last_sent_for = $2
                        WHERE id = $1 AND (last_sent_for IS NULL OR last_sent_for < $2) RETURNING id`;
            claimArgs = [r.id, target];
        } else {
            if (r.last_sent_for) continue;
            target = r.festival_date;
            if (covered.has(`${r.user_id}:${r.tradition}:${target}`)) {
                // Already e-mailed via this user's "all festivals" reminder in this run —
                // mark this one done too so it doesn't fire separately later.
                await pool.query(`UPDATE user_festival_reminders SET last_sent_for = $2 WHERE id = $1 AND last_sent_for IS NULL`, [r.id, target]);
                continue;
            }
            festivals = [{ name: r.festival_name, date: target, description: '' }];
            claimSql = `UPDATE user_festival_reminders SET last_sent_for = $2
                        WHERE id = $1 AND last_sent_for IS NULL RETURNING id`;
            claimArgs = [r.id, target];
        }

        const claim = await pool.query(claimSql, claimArgs);
        if (!claim.rowCount) continue;

        try {
            await mailer.sendFestivalReminderEmail(r.email, r.full_name, {
                traditionLabel: `${calendarLabel(r.tradition)} calendar`,
                daysBefore: Math.max(0, diffDays(target, todayIST)),
                festivals: festivals.map(f => ({ name: f.name, description: f.description, dateLabel: dateLabel(f.date) })),
            });
            sent++;
            if (r.festival_name == null) covered.add(`${r.user_id}:${r.tradition}:${target}`);
        } catch (err) {
            failed++;
            console.error(`Festival reminder e-mail failed (reminder ${r.id}):`, err.message);
            await pool.query(`UPDATE user_festival_reminders SET last_sent_for = $3 WHERE id = $1 AND last_sent_for = $2`,
                [r.id, target, r.last_sent_for || null]);
        }
    }
    return { sent, failed };
}

let running = false;
async function dispatchAll(opts = {}) {
    const none = { sent: 0, failed: 0 };
    if (!opts.mailer && !emailService.isEmailConfigured()) {
        return { skipped: 'SMTP_USER / SMTP_PASS are not configured', events: none, festivals: none };
    }
    if (running) return { skipped: 'already running', events: none, festivals: none };
    running = true;
    try {
        const events = await dispatchEventReminders(opts);
        const festivals = await dispatchFestivalReminders(opts);
        return { events, festivals };
    } finally {
        running = false;
    }
}

// In-process timer for normal (non-serverless) hosting.
function startReminderScheduler(intervalMs = 5 * 60 * 1000) {
    const tick = () => dispatchAll()
        .then((r) => { if (r.events?.sent || r.festivals?.sent) console.log('📧 Reminders sent:', JSON.stringify(r)); })
        .catch((err) => console.error('Reminder scheduler error:', err.message));
    const t = setInterval(tick, intervalMs);
    t.unref?.();
    setTimeout(tick, 15000).unref?.();
    console.log(`   Reminders    : e-mail scheduler running every ${Math.round(intervalMs / 60000)} min`);
    return t;
}

module.exports = { dispatchAll, dispatchEventReminders, dispatchFestivalReminders, startReminderScheduler };
