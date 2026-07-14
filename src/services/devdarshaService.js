const pool = require('../config/db');

const API_URL = 'https://panchang.devdarsha.com/v1/panchang/daily';
const API_KEY = process.env.DEVDARSHA_API_KEY; // put your key in .env, never hardcode it
const DEFAULT_CITY = process.env.DEVDARSHA_DEFAULT_CITY || 'ujjain';

// ─── Get panchang for one date, using cache first ────────────────────────────
async function getPanchangForDate(date, cityId = DEFAULT_CITY) {
  // 1. Check cache first
  const cached = await pool.query(
    `SELECT raw_data FROM panchang_cache WHERE date = $1 AND city_id = $2`,
    [date, cityId]
  );
  if (cached.rows.length > 0) {
    return { ...cached.rows[0].raw_data, _cached: true };
  }

  // 2. Not cached — call the real API
  if (!API_KEY) {
    throw new Error('DEVDARSHA_API_KEY is not set in .env');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'X-Api-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date, city_id: cityId }),
  });

  if (!response.ok) {
    throw new Error(`DevDarsha API error: ${response.status}`);
  }

  const json = await response.json();

  // 3. Save to cache for next time (ON CONFLICT in case of a race condition)
  await pool.query(
    `INSERT INTO panchang_cache (date, city_id, raw_data)
     VALUES ($1, $2, $3)
     ON CONFLICT (date, city_id) DO UPDATE SET raw_data = $3`,
    [date, cityId, json]
  );

  return { ...json, _cached: false };
}

// ─── Get panchang + festivals for an entire month (used by the calendar grid) ─
// Calls getPanchangForDate for each day; cached days are instant,
// new days hit the API and get cached for future requests.
async function getPanchangForMonth(year, month, cityId = DEFAULT_CITY) {
  const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-12 here
  const results = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    try {
      const data = await getPanchangForDate(dateStr, cityId);
      results.push({ date: dateStr, ...data });
    } catch (err) {
      console.error(`Failed to fetch panchang for ${dateStr}:`, err.message);
      results.push({ date: dateStr, error: true, festivals: { total: 0, data: [] } });
    }
  }

  return results;
}

module.exports = {
  getPanchangForDate,
  getPanchangForMonth,
};
