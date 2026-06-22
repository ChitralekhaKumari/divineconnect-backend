// divineConnect/divineconnect_backend/src/scripts/initCalendarDb.js
// REPLACE your existing file with this version
// Run with:  node src/scripts/initCalendarDb.js

require('dotenv').config();
const pool = require('../config/db');

async function initCalendarDb() {
  const client = await pool.connect();
  try {
    console.log('🔧 Creating calendar tables...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS festivals (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255)  NOT NULL,
        date        DATE          NOT NULL,
        deity       VARCHAR(255),
        description TEXT,
        fasting     BOOLEAN       DEFAULT FALSE,
        tags        TEXT[]        DEFAULT '{}',
        region      VARCHAR(100)  DEFAULT 'Pan-India',
        category    VARCHAR(50)   DEFAULT 'Hindu',
        is_active   BOOLEAN       DEFAULT TRUE,
        created_at  TIMESTAMP     DEFAULT NOW()
      );
    `);

    // Safe to re-run — adds columns only if missing (for existing tables)
    await client.query(`ALTER TABLE festivals ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';`);
    await client.query(`ALTER TABLE festivals ADD COLUMN IF NOT EXISTS region VARCHAR(100) DEFAULT 'Pan-India';`);
    await client.query(`ALTER TABLE festivals ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Hindu';`);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_festivals_date ON festivals(date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_festivals_region ON festivals(region);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_festivals_category ON festivals(category);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS calendar_reminders (
        id           SERIAL PRIMARY KEY,
        festival_id  INTEGER REFERENCES festivals(id) ON DELETE CASCADE,
        user_email   VARCHAR(255) NOT NULL,
        remind_days  INTEGER DEFAULT 1,
        created_at   TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS calendar_favourites (
        id           SERIAL PRIMARY KEY,
        festival_id  INTEGER REFERENCES festivals(id) ON DELETE CASCADE,
        user_email   VARCHAR(255) NOT NULL,
        created_at   TIMESTAMP DEFAULT NOW(),
        UNIQUE(festival_id, user_email)
      );
    `);

    console.log('✅ Calendar tables ready');
  } catch (err) {
    console.error('❌ initCalendarDb failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

initCalendarDb().catch(() => process.exit(1));