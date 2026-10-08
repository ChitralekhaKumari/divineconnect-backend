// User calendar events: Event / Task / Meeting / Birthday / Anniversary
// (plus read-only events imported from Google Calendar).
const pool = require('../config/db');
const {
    RECURRENCES, addDays, diffDays, occurrencesBetween, isValidTimeZone,
    reminderInstant, zonedToUtc,
} = require('../utils/eventRecurrence');

const EVENT_TYPES = ['event', 'task', 'meeting', 'birthday', 'anniversary'];
// Minutes before the event to e-mail a reminder. 0 = at start time.
// (All-day events such as birthdays are reminded at 09:00 local time.)
const REMINDER_OPTIONS = [0, 10, 30, 60, 120, 1440, 2880, 10080];
const DEFAULT_TZ = 'Asia/Kolkata';

// ─── Schema ─────────────────────────────────────────────────────────────────
// Created lazily (same approach as googleCalendarService) so a fresh deploy
// works without a manual migration; scripts/createCalendarEventsTables.js
// runs the exact same SQL if you prefer to run it by hand.
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS user_calendar_events (
  id                 SERIAL PRIMARY KEY,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title              VARCHAR(200) NOT NULL,
  event_type         VARCHAR(20)  NOT NULL DEFAULT 'event'
                     CHECK (event_type IN ('event','task','meeting','birthday','anniversary')),
  description        TEXT,
  location           VARCHAR(500),
  start_date         DATE NOT NULL,
  end_date           DATE,
  start_time         TIME,
  end_time           TIME,
  all_day            BOOLEAN NOT NULL DEFAULT TRUE,
  timezone           VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  recurrence         VARCHAR(10) NOT NULL DEFAULT 'none'
                     CHECK (recurrence IN ('none','daily','weekly','monthly','yearly')),
  reminder_minutes   INTEGER,
  last_reminded_for  DATE,
  completed          BOOLEAN NOT NULL DEFAULT FALSE,
  source             VARCHAR(10) NOT NULL DEFAULT 'local' CHECK (source IN ('local','google')),
  google_calendar_id TEXT,
  google_event_id    TEXT,
  google_link        TEXT,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_start ON user_calendar_events(user_id, start_date);
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_calendar_events_google
  ON user_calendar_events(user_id, google_calendar_id, google_event_id) WHERE google_event_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS user_festival_reminders (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tradition       VARCHAR(30) NOT NULL,
  festival_name   VARCHAR(255),          -- NULL = every festival of this tradition
  festival_date   DATE,                  -- NULL when festival_name is NULL
  days_before     INTEGER NOT NULL DEFAULT 1 CHECK (days_before BETWEEN 0 AND 14),
  last_sent_for   DATE,
  created_at      TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_festival_reminders
  ON user_festival_reminders(user_id, tradition, COALESCE(festival_name, ''), COALESCE(festival_date, DATE '1970-01-01'));
CREATE INDEX IF NOT EXISTS idx_user_festival_reminders_user ON user_festival_reminders(user_id);

CREATE TABLE IF NOT EXISTS user_google_calendar_connections (
  user_id          INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  google_email     VARCHAR(255),
  refresh_token    TEXT NOT NULL,          -- AES-256-GCM encrypted, see googleCalendarSyncService
  access_token     TEXT,
  access_expires   TIMESTAMP,
  last_synced_at   TIMESTAMP,
  last_sync_count  INTEGER,
  created_at       TIMESTAMP DEFAULT NOW()
);
`;

let schemaReady = null;
function ensureTables() {
    if (!schemaReady) {
        schemaReady = pool.query(SCHEMA_SQL).catch((err) => { schemaReady = null; throw err; });
    }
    return schemaReady;
}

// ─── Validation ─────────────────────────────────────────────────────────────
class ValidationError extends Error {}

const isDay = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
    && !isNaN(Date.parse(v + 'T00:00:00Z')) && new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v;
const isTime = (v) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const str = (v, max) => (v == null ? '' : String(v)).trim().slice(0, max);

// Returns a clean, DB-ready object or throws ValidationError.
function validateEventInput(body) {
    const title = str(body.title, 200);
    if (!title) throw new ValidationError('Title is required.');

    const event_type = body.event_type || 'event';
    if (!EVENT_TYPES.includes(event_type)) throw new ValidationError('Invalid event type.');

    if (!isDay(body.start_date)) throw new ValidationError('A valid start date is required.');
    const start_date = body.start_date;

    // Birthdays & anniversaries are always all-day. Otherwise honour `all_day`;
    // if it's omitted, a start_time implies a timed event.
    const explicitAllDay = body.all_day === undefined ? undefined : (body.all_day === true || body.all_day === 'true');
    const all_day = (event_type === 'birthday' || event_type === 'anniversary')
        ? true
        : explicitAllDay !== undefined ? explicitAllDay : !body.start_time;

    let start_time = null, end_time = null, end_date = null;
    if (!all_day) {
        if (!isTime(body.start_time)) throw new ValidationError('A start time is required for timed events.');
        start_time = body.start_time;
        if (body.end_time) {
            if (!isTime(body.end_time)) throw new ValidationError('Invalid end time.');
            end_time = body.end_time;
        }
    }
    if (body.end_date) {
        if (!isDay(body.end_date)) throw new ValidationError('Invalid end date.');
        end_date = body.end_date;
    }
    if (end_date && end_date < start_date) throw new ValidationError('End date cannot be before the start date.');
    if (!all_day && end_time && (!end_date || end_date === start_date) && end_time < start_time) {
        throw new ValidationError('End time cannot be before the start time.');
    }
    if (end_date && diffDays(end_date, start_date) > 366) throw new ValidationError('An event can span at most one year.');
    if (end_date === start_date) end_date = null;

    let recurrence = body.recurrence || 'none';
    if (!RECURRENCES.includes(recurrence)) throw new ValidationError('Invalid repeat option.');
    if (event_type === 'task') recurrence = 'none';

    let reminder_minutes = null;
    if (body.reminder_minutes !== undefined && body.reminder_minutes !== null && body.reminder_minutes !== '') {
        reminder_minutes = Number(body.reminder_minutes);
        if (!REMINDER_OPTIONS.includes(reminder_minutes)) throw new ValidationError('Invalid reminder option.');
    }

    const timezone = body.timezone && isValidTimeZone(body.timezone) ? body.timezone : DEFAULT_TZ;

    return {
        title, event_type, start_date, end_date, start_time, end_time, all_day, timezone,
        recurrence, reminder_minutes,
        description: str(body.description, 5000) || null,
        location: str(body.location, 500) || null,
    };
}

// ─── Row shaping ────────────────────────────────────────────────────────────
const hhmm = (t) => (t ? String(t).slice(0, 5) : null);

function shapeRow(r) {
    return {
        id: r.id,
        title: r.title,
        event_type: r.event_type,
        description: r.description || '',
        location: r.location || '',
        start_date: r.start_date,
        end_date: r.end_date || null,
        start_time: hhmm(r.start_time),
        end_time: hhmm(r.end_time),
        all_day: r.all_day,
        timezone: r.timezone,
        recurrence: r.recurrence,
        reminder_minutes: r.reminder_minutes,
        completed: r.completed,
        source: r.source,
        google_link: r.google_link || null,
    };
}

// If the reminder moment for an upcoming occurrence has already passed when an
// event is saved (e.g. "1 day before" on an event that is tomorrow morning), we
// mark it as handled so the user doesn't get a stale reminder moments later.
function baselineRemindedFor(ev, now = new Date()) {
    if (ev.reminder_minutes == null) return null;
    const today = now.toISOString().slice(0, 10);
    const occs = occurrencesBetween(ev.start_date, ev.recurrence, addDays(today, -2), addDays(today, 9));
    let last = null;
    for (const d of occs) {
        if (reminderInstant(d, ev.start_time, ev.all_day, ev.reminder_minutes, ev.timezone) <= now) last = d;
    }
    return last;
}

// ─── CRUD ───────────────────────────────────────────────────────────────────
const COLS = `id, user_id, title, event_type, description, location, start_date::text, end_date::text,
  start_time::text, end_time::text, all_day, timezone, recurrence, reminder_minutes, completed,
  source, google_link, last_reminded_for::text`;

async function createEvent(userId, input) {
    await ensureTables();
    const ev = validateEventInput(input);
    const { rows } = await pool.query(
        `INSERT INTO user_calendar_events
           (user_id, title, event_type, description, location, start_date, end_date, start_time, end_time,
            all_day, timezone, recurrence, reminder_minutes, last_reminded_for)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING ${COLS}`,
        [userId, ev.title, ev.event_type, ev.description, ev.location, ev.start_date, ev.end_date,
            ev.start_time, ev.end_time, ev.all_day, ev.timezone, ev.recurrence, ev.reminder_minutes,
            baselineRemindedFor(ev)]
    );
    return shapeRow(rows[0]);
}

async function updateEvent(userId, id, input) {
    await ensureTables();
    const existing = await pool.query(`SELECT source FROM user_calendar_events WHERE id = $1 AND user_id = $2`, [id, userId]);
    if (!existing.rows.length) return null;
    if (existing.rows[0].source === 'google') {
        throw new ValidationError('Events imported from Google Calendar are read-only. Edit them in Google Calendar.');
    }
    const ev = validateEventInput(input);
    const { rows } = await pool.query(
        `UPDATE user_calendar_events SET
            title=$3, event_type=$4, description=$5, location=$6, start_date=$7, end_date=$8,
            start_time=$9, end_time=$10, all_day=$11, timezone=$12, recurrence=$13,
            reminder_minutes=$14, last_reminded_for=$15, updated_at=NOW()
         WHERE id=$1 AND user_id=$2
         RETURNING ${COLS}`,
        [id, userId, ev.title, ev.event_type, ev.description, ev.location, ev.start_date, ev.end_date,
            ev.start_time, ev.end_time, ev.all_day, ev.timezone, ev.recurrence, ev.reminder_minutes,
            baselineRemindedFor(ev)]
    );
    return shapeRow(rows[0]);
}

async function deleteEvent(userId, id) {
    await ensureTables();
    const { rowCount } = await pool.query(
        `DELETE FROM user_calendar_events WHERE id = $1 AND user_id = $2 AND source = 'local'`, [id, userId]);
    return rowCount > 0;
}

async function setCompleted(userId, id, completed) {
    await ensureTables();
    const { rows } = await pool.query(
        `UPDATE user_calendar_events SET completed = $3, updated_at = NOW()
         WHERE id = $1 AND user_id = $2 AND event_type = 'task' RETURNING ${COLS}`,
        [id, userId, !!completed]);
    return rows[0] ? shapeRow(rows[0]) : null;
}

// Every occurrence that touches [from, to], one item per calendar day it covers.
async function listEventsInRange(userId, from, to) {
    await ensureTables();
    const { rows } = await pool.query(
        `SELECT ${COLS} FROM user_calendar_events
         WHERE user_id = $1 AND start_date <= $3
           AND (recurrence <> 'none' OR COALESCE(end_date, start_date) >= $2)
         ORDER BY start_date, start_time NULLS FIRST, id`,
        [userId, from, to]);

    const items = [];
    for (const row of rows) {
        const ev = shapeRow(row);
        const span = ev.end_date ? diffDays(ev.end_date, ev.start_date) : 0;
        const starts = occurrencesBetween(ev.start_date, ev.recurrence, addDays(from, -span), to);
        for (const occStart of starts) {
            for (let i = 0; i <= span; i++) {
                const day = addDays(occStart, i);
                if (day < from || day > to) continue;
                items.push({
                    ...ev,
                    key: `${ev.id}:${day}`,
                    date: day,
                    occurrence_start: occStart,
                    occurrence_end: addDays(occStart, span),
                });
            }
        }
    }
    items.sort((a, b) =>
        a.date.localeCompare(b.date)
        || (a.all_day === b.all_day ? 0 : a.all_day ? -1 : 1)
        || String(a.start_time || '').localeCompare(String(b.start_time || ''))
        || a.id - b.id);
    return items;
}

module.exports = {
    EVENT_TYPES, REMINDER_OPTIONS, DEFAULT_TZ, ValidationError,
    ensureTables, SCHEMA_SQL, validateEventInput, baselineRemindedFor,
    createEvent, updateEvent, deleteEvent, setCompleted, listEventsInRange,
    // used by reminderService
    COLS, shapeRow, zonedToUtc,
};
