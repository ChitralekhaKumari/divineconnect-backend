/**
 * Adds the AP-TMS-style sidebar fields to the temples table:
 * Temple Activities, Annadanam Donation, Hundi, Guidelines, Adopted
 * Temples, Temple Members, Rituals, Muttam & Peetams, Transport,
 * Route Map / Distance.
 *
 * Run:
 *   node src/scripts/migrateTempleTmsFields.js
 */
require('dotenv').config();
const pool = require('../config/db');

const SQL = `
ALTER TABLE temples
  ADD COLUMN IF NOT EXISTS temple_activities JSONB DEFAULT '[]',   -- [{name, description, timing}]
  ADD COLUMN IF NOT EXISTS annadanam_info    TEXT,
  ADD COLUMN IF NOT EXISTS hundi_info        TEXT,
  ADD COLUMN IF NOT EXISTS guidelines        TEXT[] DEFAULT '{}',  -- bullet points
  ADD COLUMN IF NOT EXISTS adopted_temples   JSONB DEFAULT '[]',   -- [{name, location}]
  ADD COLUMN IF NOT EXISTS temple_members    JSONB DEFAULT '[]',   -- [{name, designation}]
  ADD COLUMN IF NOT EXISTS rituals           JSONB DEFAULT '[]',   -- [{name, description, frequency}]
  ADD COLUMN IF NOT EXISTS muttams_peetams   TEXT,
  ADD COLUMN IF NOT EXISTS transport_info    TEXT,
  ADD COLUMN IF NOT EXISTS distance_info     TEXT;
`;

async function migrate() {
  try {
    console.log('Adding AP-TMS sidebar columns to temples table...');
    await pool.query(SQL);
    console.log('✅ Done.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
