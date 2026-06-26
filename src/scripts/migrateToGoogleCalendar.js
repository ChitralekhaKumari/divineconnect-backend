// src/scripts/migrateToGoogleCalendar.js
// Run once: node src/scripts/migrateToGoogleCalendar.js
// - Drops old festivals / calendar_reminders / calendar_favourites tables
// - Creates google_holidays table
// - Pre-fetches current year from Google Calendar API

require('dotenv').config();
const pool = require('../config/db');
const { ensureTable, fetchAndCacheYear } = require('../services/googleCalendarService');

async function migrate() {
    console.log('🔧 Starting migration to Google Calendar...\n');

    const client = await pool.connect();
    try {
        // Drop old tables
        console.log('🗑  Dropping old calendar tables...');
        await client.query(`
      DROP TABLE IF EXISTS calendar_favourites CASCADE;
      DROP TABLE IF EXISTS calendar_reminders CASCADE;
      DROP TABLE IF EXISTS festivals CASCADE;
    `);
        console.log('   ✅ Old tables dropped.\n');
    } finally {
        client.release();
    }

    // Create new table
    console.log('📦 Creating google_holidays table...');
    await ensureTable();
    console.log('   ✅ Table created.\n');

    // Pre-fetch current year
    const year = new Date().getFullYear();
    console.log(`📅 Fetching ${year} holidays from Google Calendar...`);
    const count = await fetchAndCacheYear(year);
    console.log(`   ✅ ${count} holidays cached.\n`);

    console.log('🎉 Migration complete!');
    await pool.end();
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});
