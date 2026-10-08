/**
 * Adds the extra "sidebar" fields to the temples table — the ones you see
 * on the AP Temples portal (tms.ap.gov.in) when you open a temple: Sevas,
 * Darshan types, Accommodation, Donation/Hundi, Photo Gallery and Online
 * Services links.
 *
 * Safe to run multiple times (IF NOT EXISTS everywhere). Existing rows get
 * NULL / empty defaults for the new columns — nothing you already have is
 * touched.
 *
 * Run:
 *   node src/scripts/migrateTempleSidebarFields.js
 */
require('dotenv').config();
const pool = require('../config/db');

const SQL = `
ALTER TABLE temples
  -- Sevas / Poojas offered — [{ "name": "Archana", "timing": "6:00 AM", "price": "₹100", "description": "..." }]
  ADD COLUMN IF NOT EXISTS sevas             JSONB DEFAULT '[]',

  -- Darshan types (Free / Special / VIP) — [{ "name": "Special Darshan", "price": "₹300", "duration": "30 min", "description": "..." }]
  ADD COLUMN IF NOT EXISTS darshan_types     JSONB DEFAULT '[]',

  -- Free-text accommodation info (choultries, guest houses run by the temple trust)
  ADD COLUMN IF NOT EXISTS accommodation_info TEXT,

  -- Free-text donation / Hundi info (bank details, 80G, online donation blurb)
  ADD COLUMN IF NOT EXISTS donation_info     TEXT,

  -- Extra narrative for "How to Reach" beyond the nearest_railway/airport fields
  ADD COLUMN IF NOT EXISTS how_to_reach      TEXT,

  -- Photo gallery — plain array of image URLs
  ADD COLUMN IF NOT EXISTS gallery_images    TEXT[] DEFAULT '{}',

  -- Trust / administration body that runs the temple
  ADD COLUMN IF NOT EXISTS temple_trust      VARCHAR(255),

  -- Online service links, mirroring AP TMS's Darsanam / Seva / Hundi / Donation / Accommodation booking links
  -- { "darshan_booking_url": "...", "seva_booking_url": "...", "donation_url": "...", "accommodation_url": "..." }
  ADD COLUMN IF NOT EXISTS online_services   JSONB DEFAULT '{}';
`;

async function migrate() {
  try {
    console.log('Adding sidebar-detail columns to temples table...');
    await pool.query(SQL);
    console.log('✅ Done. New columns: sevas, darshan_types, accommodation_info, donation_info, how_to_reach, gallery_images, temple_trust, online_services');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
