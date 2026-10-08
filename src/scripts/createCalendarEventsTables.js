// Run once (optional — the API also creates these tables on first use):
//   node src/scripts/createCalendarEventsTables.js
// Creates: user_calendar_events, user_festival_reminders, user_google_calendar_connections
require('dotenv').config();
const pool = require('../config/db');
const { SCHEMA_SQL } = require('../services/calendarEventsService');

async function run() {
  try {
    console.log('Creating calendar event tables…');
    await pool.query(SCHEMA_SQL);
    console.log('✅ Done. Tables ready: user_calendar_events, user_festival_reminders, user_google_calendar_connections');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
