// PASTE THIS FILE HERE:
// divineconnect_backend/src/scripts/upgradeCalendarDb.js
//
// HOW TO RUN: open terminal in divineconnect_backend folder, type:
// node src/scripts/upgradeCalendarDb.js

require('dotenv').config();
const pool = require('../config/db');

async function upgradeCalendarDb() {
  const client = await pool.connect();
  try {
    console.log('Upgrading festivals table...');

    // Add a "type" column so we know if it's festival, vrat, ekadashi, purnima, amavasya, temple
    await client.query(`
      ALTER TABLE festivals
      ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'festival';
    `);

    // Add column to mark public holiday
    await client.query(`
      ALTER TABLE festivals
      ADD COLUMN IF NOT EXISTS is_holiday BOOLEAN DEFAULT FALSE;
    `);

    // Add column for temple event flag
    await client.query(`
      ALTER TABLE festivals
      ADD COLUMN IF NOT EXISTS is_temple_event BOOLEAN DEFAULT FALSE;
    `);

    // Panchang table — one row per day
    await client.query(`
      CREATE TABLE IF NOT EXISTS panchang (
        id              SERIAL PRIMARY KEY,
        date            DATE UNIQUE NOT NULL,
        tithi           VARCHAR(100),
        nakshatra       VARCHAR(100),
        yoga            VARCHAR(100),
        karana          VARCHAR(100),
        sunrise         VARCHAR(20),
        sunset          VARCHAR(20),
        moonrise        VARCHAR(20),
        moonset         VARCHAR(20),
        rahu_kalam      VARCHAR(50),
        gulika_kalam    VARCHAR(50),
        yamaganda       VARCHAR(50),
        abhijit_muhurat VARCHAR(50),
        brahma_muhurat  VARCHAR(50),
        created_at      TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_panchang_date ON panchang(date);
      CREATE INDEX IF NOT EXISTS idx_festivals_type ON festivals(type);
    `);

    console.log('Database upgrade done.');
  } catch (err) {
    console.error('Upgrade failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

upgradeCalendarDb().catch(() => process.exit(1));
