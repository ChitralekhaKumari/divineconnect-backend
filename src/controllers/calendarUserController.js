// Authenticated, per-user calendar features: events, festival reminders,
// Google Calendar import, and the reminder dispatch hook.
const crypto = require('crypto');
const events = require('../services/calendarEventsService');
const festRem = require('../services/festivalRemindersService');
const gsync = require('../services/googleCalendarSyncService');
const { dispatchAll } = require('../services/reminderService');

function handle(fn) {
    return async (req, res) => {
        try {
            await fn(req, res);
        } catch (err) {
            if (err instanceof events.ValidationError) {
                return res.status(400).json({ success: false, message: err.message });
            }
            if (err instanceof gsync.GoogleSyncError) {
                return res.status(err.status).json({ success: false, message: err.message, reconnect: err.reconnect });
            }
            console.error(`${req.method} ${req.originalUrl} failed:`, err.message);
            res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
        }
    };
}

const toId = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 ? n : null; };
const isDay = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

// ─── Events ─────────────────────────────────────────────────────────────────
// GET /api/calendar/events?year=2026&month=9      (or ?from=YYYY-MM-DD&to=YYYY-MM-DD, max 400 days)
const listEvents = handle(async (req, res) => {
    let from, to;
    if (req.query.from && req.query.to) {
        ({ from, to } = req.query);
        if (!isDay(from) || !isDay(to) || to < from) {
            return res.status(400).json({ success: false, message: 'from/to must be valid YYYY-MM-DD dates.' });
        }
        if ((Date.parse(to) - Date.parse(from)) / 86400000 > 400) {
            return res.status(400).json({ success: false, message: 'Date range too large (max 400 days).' });
        }
    } else {
        const y = parseInt(req.query.year, 10), m = parseInt(req.query.month, 10);
        if (!y || !m || m < 1 || m > 12 || y < 1970 || y > 2200) {
            return res.status(400).json({ success: false, message: 'year and month are required.' });
        }
        from = `${y}-${String(m).padStart(2, '0')}-01`;
        to = `${y}-${String(m).padStart(2, '0')}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;
    }
    const data = await events.listEventsInRange(req.user.id, from, to);
    res.json({ success: true, count: data.length, data });
});

const createEvent = handle(async (req, res) => {
    const data = await events.createEvent(req.user.id, req.body || {});
    res.status(201).json({ success: true, data });
});

const updateEvent = handle(async (req, res) => {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid id.' });
    const data = await events.updateEvent(req.user.id, id, req.body || {});
    if (!data) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, data });
});

const deleteEvent = handle(async (req, res) => {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid id.' });
    const ok = await events.deleteEvent(req.user.id, id);
    if (!ok) return res.status(404).json({ success: false, message: 'Event not found (or it is imported from Google Calendar).' });
    res.json({ success: true });
});

const completeTask = handle(async (req, res) => {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid id.' });
    const data = await events.setCompleted(req.user.id, id, req.body?.completed);
    if (!data) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.json({ success: true, data });
});

// ─── Festival reminders ─────────────────────────────────────────────────────
const listFestivalReminders = handle(async (req, res) => {
    res.json({ success: true, data: await festRem.listReminders(req.user.id) });
});
const addFestivalReminder = handle(async (req, res) => {
    res.status(201).json({ success: true, data: await festRem.addReminder(req.user.id, req.body || {}) });
});
const removeFestivalReminder = handle(async (req, res) => {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid id.' });
    const ok = await festRem.removeReminder(req.user.id, id);
    if (!ok) return res.status(404).json({ success: false, message: 'Reminder not found.' });
    res.json({ success: true });
});

// ─── Google Calendar ────────────────────────────────────────────────────────
const googleStatus = handle(async (req, res) => {
    res.json({ success: true, data: await gsync.getStatus(req.user.id) });
});

const googleConnect = handle(async (req, res) => {
    res.json({ success: true, url: gsync.buildAuthUrl(req.user.id) });
});

// Browser is redirected here by Google (no Authorization header) — identity comes from the signed `state`.
async function googleCallback(req, res) {
    const back = (qs) => res.redirect(`${gsync.clientUrl()}/calendar?${qs}`);
    try {
        if (req.query.error) return back(`google=${req.query.error === 'access_denied' ? 'denied' : 'error'}`);
        if (!req.query.code || !req.query.state) return back('google=error');
        await gsync.handleCallback(String(req.query.code), String(req.query.state));
        back('google=connected');
    } catch (err) {
        console.error('Google callback failed:', err.message);
        back('google=error');
    }
}

const SYNC_COOLDOWN_MS = 20 * 1000;
const googleSync = handle(async (req, res) => {
    const status = await gsync.getStatus(req.user.id);
    if (!status.connected) return res.status(400).json({ success: false, message: 'Google Calendar is not connected.' });
    if (status.last_synced_at && Date.now() - new Date(status.last_synced_at + 'Z').getTime() < SYNC_COOLDOWN_MS
        && req.query.force !== '1') {
        return res.status(429).json({ success: false, message: 'Synced a moment ago — please wait a few seconds.' });
    }
    res.json({ success: true, data: await gsync.syncUser(req.user.id) });
});

const googleDisconnect = handle(async (req, res) => {
    res.json({ success: true, data: await gsync.disconnect(req.user.id) });
});

// ─── Reminder dispatch (for external schedulers) ────────────────────────────
// Authorization: Bearer <CRON_SECRET>   — Vercel Cron sends exactly this header.
async function dispatchReminders(req, res) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return res.status(503).json({ success: false, message: 'CRON_SECRET is not configured.' });
    const given = (req.headers.authorization || '').replace(/^Bearer /, '');
    const a = Buffer.from(given), b = Buffer.from(secret);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    try {
        res.json({ success: true, ...(await dispatchAll()) });
    } catch (err) {
        console.error('dispatchReminders failed:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    listEvents, createEvent, updateEvent, deleteEvent, completeTask,
    listFestivalReminders, addFestivalReminder, removeFestivalReminder,
    googleStatus, googleConnect, googleCallback, googleSync, googleDisconnect,
    dispatchReminders,
};
