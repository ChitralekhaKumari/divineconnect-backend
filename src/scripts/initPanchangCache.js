require('dotenv').config();
const pool = require('../config/db');

async function initPanchangCache() {
  const client = await pool.connect();
  try {
    console.log('🔧 Creating panchang_cache table...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS panchang_cache (
        id          SERIAL PRIMARY KEY,
        date        DATE          NOT NULL,
        city_id     VARCHAR(100)  NOT NULL,
        raw_data    JSONB         NOT NULL,
        fetched_at  TIMESTAMP     DEFAULT NOW(),
        UNIQUE(date, city_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_panchang_cache_date ON panchang_cache(date);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_panchang_cache_city ON panchang_cache(city_id);
    `);

    console.log('✅ panchang_cache table ready');
  } catch (err) {
    console.error('❌ initPanchangCache failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

initPanchangCache().catch(() => process.exit(1));
