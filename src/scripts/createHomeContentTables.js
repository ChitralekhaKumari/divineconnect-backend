// Run once: node src/scripts/createHomeContentTables.js
// Creates the tables that back the admin-editable Home page:
//   - home_content : singleton row for hero + astrology-CTA copy
//   - home_stats   : repeatable stat pills under the hero ("500+ Sacred Rituals")
//   - home_sections: which page sections show, and in what order
require('dotenv').config();
const pool = require('../config/db');

const SQL = `
CREATE TABLE IF NOT EXISTS home_content (
  id                    SMALLINT PRIMARY KEY DEFAULT 1,
  hero_title            VARCHAR(255) NOT NULL DEFAULT 'Where Faith',
  hero_title_highlight  VARCHAR(255) NOT NULL DEFAULT 'Meets Technology',
  hero_description      TEXT NOT NULL DEFAULT 'Discover sacred temples, chant daily prayers, listen to devotional bhajans, read timeless scriptures, and receive AI-powered spiritual guidance — all from your sacred space.',
  hero_image_url        TEXT NOT NULL DEFAULT '/src/assets/images/hero-temple.jpg',
  hero_cta_text         VARCHAR(100) NOT NULL DEFAULT 'Explore Temples',
  hero_cta_link         VARCHAR(255) NOT NULL DEFAULT '/temples',
  astrology_label        VARCHAR(100) NOT NULL DEFAULT 'PERSONALIZED ASTROLOGY',
  astrology_title         VARCHAR(255) NOT NULL DEFAULT 'Discover Your',
  astrology_title_highlight VARCHAR(255) NOT NULL DEFAULT 'Cosmic Path',
  astrology_description  TEXT NOT NULL DEFAULT 'Explore Vedic Astrology to understand your personality, career, relationships, health, and future. Get personalized horoscope insights, daily predictions, and spiritual guidance based on your birth chart.',
  astrology_image_url    TEXT NOT NULL DEFAULT 'https://puja-plus-connect.lovable.app/assets/ai-guru-bg-B20UcBAf.jpg',
  astrology_cta_text     VARCHAR(100) NOT NULL DEFAULT 'Explore Astrology →',
  astrology_cta_link     VARCHAR(255) NOT NULL DEFAULT '/astrology',
  updated_at            TIMESTAMP DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS home_stats (
  id             SERIAL PRIMARY KEY,
  value          VARCHAR(20) NOT NULL,
  label          VARCHAR(100) NOT NULL,
  display_order  INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS home_sections (
  id             SERIAL PRIMARY KEY,
  section_key    VARCHAR(50) NOT NULL UNIQUE, -- 'hero' | 'temples' | 'prayers' | 'bhajans' | 'scriptures' | 'astrology_cta'
  label          VARCHAR(100) NOT NULL,       -- friendly name shown in admin
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  display_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_home_stats_order ON home_stats(display_order);
CREATE INDEX IF NOT EXISTS idx_home_sections_order ON home_sections(display_order);
`;

const SEED_DEFAULTS = `
INSERT INTO home_content (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO home_stats (value, label, display_order) VALUES
  ('500+', 'Sacred Rituals', 1),
  ('50+',  'Partner Temples', 2),
  ('1M+',  'Blessings Delivered', 3),
  ('24/7', 'Live Darshan', 4)
ON CONFLICT DO NOTHING;

INSERT INTO home_sections (section_key, label, display_order) VALUES
  ('hero', 'Hero Banner', 1),
  ('temples', 'Featured Temples', 2),
  ('prayers', 'Daily Prayers', 3),
  ('bhajans', 'Featured Bhajans', 4),
  ('scriptures', 'Scriptures Preview', 5),
  ('astrology_cta', 'Astrology CTA', 6)
ON CONFLICT (section_key) DO NOTHING;
`;

const CHECK_ONLY = process.argv.includes('--check');

async function tableExists(client, name) {
    const { rows } = await client.query(
        `SELECT EXISTS (
       SELECT FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     )`, [name]
    );
    return rows[0].exists;
}

async function run() {
    const client = await pool.connect();
    try {
        if (CHECK_ONLY) {
            console.log('\n🔎  Checking home content tables…');
            for (const t of ['home_content', 'home_stats', 'home_sections']) {
                console.log(`    ${t.padEnd(14)}: ${(await tableExists(client, t)) ? '✅ exists' : '❌ missing'}`);
            }
            return;
        }

        console.log('\n🏠  Creating Home content tables…');
        await client.query('BEGIN');
        await client.query(SQL);
        await client.query(SEED_DEFAULTS);
        await client.query('COMMIT');

        console.log('✅  Done. Tables ready: home_content, home_stats, home_sections');
        console.log('    Seeded with the current hardcoded Home page copy as defaults.\n');
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('\n❌  Migration failed – rolled back.\n');
        console.error(err.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

run();
