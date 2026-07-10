const pool = require('../config/db');

const GOOGLE_API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'en.indian#holiday@group.v.calendar.google.com';

// ─── Ensure the google_holidays table exists ──────────────────────────────────
async function ensureTable() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS google_holidays (
      id          SERIAL PRIMARY KEY,
      date        DATE NOT NULL,
      name        TEXT NOT NULL,
      description TEXT,
      year        INTEGER NOT NULL,
      month       INTEGER NOT NULL,
      fetched_at  TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_google_holidays_date  ON google_holidays(date);
    CREATE INDEX IF NOT EXISTS idx_google_holidays_year  ON google_holidays(year);
    CREATE INDEX IF NOT EXISTS idx_google_holidays_month ON google_holidays(month, year);
  `);
}

// ─── Fetch from Google Calendar API and cache ─────────────────────────────────
async function fetchAndCacheYear(year) {
    if (!GOOGLE_API_KEY) throw new Error('GOOGLE_CALENDAR_API_KEY is not set in .env');

    const calId = encodeURIComponent(CALENDAR_ID);
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calId}/events` +
        `?key=${GOOGLE_API_KEY}` +
        `&timeMin=${year}-01-01T00:00:00Z` +
        `&timeMax=${year}-12-31T23:59:59Z` +
        `&singleEvents=true&orderBy=startTime&maxResults=200`;

    const res = await fetch(url);
    if (!res.ok) {
        const err = await res.json();
        throw new Error(`Google Calendar API error: ${err.error?.message || res.status}`);
    }

    const json = await res.json();
    const items = json.items || [];

    // Delete old cache for this year and reinsert
    await pool.query(`DELETE FROM google_holidays WHERE year = $1`, [year]);

    for (const item of items) {
        const dateStr = item.start?.date || item.start?.dateTime?.slice(0, 10);
        if (!dateStr) continue;
        const [y, m] = dateStr.split('-').map(Number);
        await pool.query(
            `INSERT INTO google_holidays (date, name, description, year, month)
       VALUES ($1, $2, $3, $4, $5)`,
            [dateStr, item.summary || '', item.description || '', y, m]
        );
    }

    console.log(`✅ Cached ${items.length} Google holidays for ${year}`);
    return items.length;
}

// ─── Check if year is cached ──────────────────────────────────────────────────
async function isYearCached(year) {
    const result = await pool.query(
        `SELECT COUNT(*) FROM google_holidays WHERE year = $1`,
        [year]
    );
    return parseInt(result.rows[0].count) > 0;
}

// ─── Get holidays for a month (fetch+cache if needed) ────────────────────────
async function getHolidaysForMonth(year, month) {
    await ensureTable();
    if (!(await isYearCached(year))) {
        await fetchAndCacheYear(year);
    }
    const result = await pool.query(
        `SELECT id, date::text, name, description FROM google_holidays
     WHERE year = $1 AND month = $2 ORDER BY date ASC`,
        [year, month]
    );
    return result.rows;
}

// ─── Get holidays for a specific date ────────────────────────────────────────
async function getHolidaysForDate(dateStr) {
    await ensureTable();
    const year = parseInt(dateStr.slice(0, 4));
    if (!(await isYearCached(year))) {
        await fetchAndCacheYear(year);
    }
    const result = await pool.query(
        `SELECT id, date::text, name, description FROM google_holidays
     WHERE date = $1 ORDER BY id ASC`,
        [dateStr]
    );
    return result.rows;
}

// ─── Get upcoming holidays from today ────────────────────────────────────────
async function getUpcomingHolidays(limit = 6) {
    await ensureTable();
    const today = new Date();
    const year = today.getFullYear();

    // Ensure this year (and next if near Dec) is cached
    if (!(await isYearCached(year))) await fetchAndCacheYear(year);
    if (today.getMonth() >= 10) { // Nov or Dec — pre-cache next year too
        const nextYear = year + 1;
        if (!(await isYearCached(nextYear))) await fetchAndCacheYear(nextYear).catch(() => { });
    }

    const result = await pool.query(
        `SELECT id, date::text, name, description FROM google_holidays
     WHERE date >= CURRENT_DATE ORDER BY date ASC LIMIT $1`,
        [limit]
    );
    return result.rows;
}

module.exports = {
    getHolidaysForMonth,
    getHolidaysForDate,
    getUpcomingHolidays,
    fetchAndCacheYear,
    ensureTable,
};
