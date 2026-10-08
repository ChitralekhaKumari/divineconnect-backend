// "Set Festival Reminders": e-mail reminders for festivals, either for every
// festival of a calendar (festival_name NULL) or for one specific festival.
const pool = require('../config/db');
const { ensureTables, ValidationError } = require('./calendarEventsService');
const { TRADITIONS, getRegionalFestivals } = require('../data/regionalFestivals');
const { getHolidaysForDate } = require('./googleCalendarService');

const CALENDARS = ['hindu', ...TRADITIONS];
const isDay = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
    && new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v;

function calendarLabel(slug) {
    return `${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
}

async function listReminders(userId) {
    await ensureTables();
    const { rows } = await pool.query(
        `SELECT id, tradition, festival_name, festival_date::text, days_before
         FROM user_festival_reminders WHERE user_id = $1
         ORDER BY (festival_name IS NOT NULL), festival_date NULLS FIRST, tradition, id`, [userId]);
    return rows;
}

async function addReminder(userId, body) {
    await ensureTables();
    const tradition = String(body.tradition || '').toLowerCase();
    if (!CALENDARS.includes(tradition)) throw new ValidationError('Unknown calendar.');

    const days = body.days_before === undefined ? 1 : Number(body.days_before);
    if (!Number.isInteger(days) || days < 0 || days > 14) throw new ValidationError('Reminder lead time must be 0–14 days.');

    let name = null, date = null;
    if (body.festival_name) {
        name = String(body.festival_name).trim().slice(0, 255);
        if (!name) throw new ValidationError('Festival name is required.');
        if (!isDay(body.festival_date)) throw new ValidationError('A valid festival date is required.');
        date = body.festival_date;
    }

    const { rows } = await pool.query(
        `INSERT INTO user_festival_reminders (user_id, tradition, festival_name, festival_date, days_before)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (user_id, tradition, COALESCE(festival_name, ''), COALESCE(festival_date, DATE '1970-01-01'))
         DO UPDATE SET days_before = EXCLUDED.days_before, last_sent_for = NULL
         RETURNING id, tradition, festival_name, festival_date::text, days_before`,
        [userId, tradition, name, date, days]);
    return rows[0];
}

async function removeReminder(userId, id) {
    await ensureTables();
    const { rowCount } = await pool.query(`DELETE FROM user_festival_reminders WHERE id = $1 AND user_id = $2`, [id, userId]);
    return rowCount > 0;
}

// Festivals that fall on `date` for a calendar — same sources the calendar page uses.
async function festivalsOnDate(calendar, date) {
    if (calendar === 'hindu') {
        const rows = await getHolidaysForDate(date);
        return rows.map(r => ({ name: r.name, date, description: r.description || '' }));
    }
    const year = Number(date.slice(0, 4));
    return getRegionalFestivals(calendar, year)
        .filter(f => f.date === date)
        .map(f => ({ name: f.name, date, description: f.description }));
}

module.exports = {
    CALENDARS, calendarLabel, listReminders, addReminder, removeReminder, festivalsOnDate,
};
