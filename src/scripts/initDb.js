require('dotenv').config();
const pool = require('../config/db');

async function initDb() {
  const client = await pool.connect();
  try {
    console.log('🔧 Initialising database schema...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS temples (
        id               SERIAL PRIMARY KEY,
        name             VARCHAR(255) NOT NULL,
        alternate_name   VARCHAR(255),
        deity            VARCHAR(255),
        other_deities    TEXT[],
        category         VARCHAR(100),         -- Shiva / Vishnu / Devi / Jain / Buddhist / Other
        location_city    VARCHAR(255),
        location_state   VARCHAR(255),
        location_country VARCHAR(100) DEFAULT 'India',
        full_address     TEXT,
        pincode          VARCHAR(20),
        latitude         DECIMAL(10,7),
        longitude        DECIMAL(10,7),
        nearest_railway  VARCHAR(255),
        nearest_airport  VARCHAR(255),

        timings_general  VARCHAR(255),
        timings_morning_aarti VARCHAR(100),
        timings_evening_aarti VARCHAR(100),
        timings_closed_on     VARCHAR(100),

        entry_fee        VARCHAR(100),
        dress_code       VARCHAR(255),
        special_darshan  TEXT,

        famous_for       TEXT,
        history          TEXT,
        best_time_visit  VARCHAR(255),
        festivals        TEXT[],

        contact_phone    VARCHAR(100),
        website          VARCHAR(500),

        image_url        VARCHAR(1000),
        tag              VARCHAR(50),          -- LIVE / POPULAR / FEATURED / NEW
        rating           DECIMAL(2,1) DEFAULT 4.5,
        reviews          INTEGER DEFAULT 0,

        is_active        BOOLEAN DEFAULT TRUE,
        created_at       TIMESTAMP DEFAULT NOW(),
        updated_at       TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_temples_category  ON temples(category);
      CREATE INDEX IF NOT EXISTS idx_temples_state     ON temples(location_state);
      CREATE INDEX IF NOT EXISTS idx_temples_deity     ON temples(deity);
      CREATE INDEX IF NOT EXISTS idx_temples_tag       ON temples(tag);
      CREATE INDEX IF NOT EXISTS idx_temples_name_trgm ON temples USING gin(to_tsvector('english', name));
    `);

    // Updated-at trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_temples_updated_at ON temples;
      CREATE TRIGGER update_temples_updated_at
        BEFORE UPDATE ON temples
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Database schema ready');
  } catch (err) {
    console.error('❌ initDb failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

initDb().catch(() => process.exit(1));
