/**
 * run-prayer-seed-full.js
 * Seeds all 32 mantras (26 new + 6 existing) into the prayers table.
 * Usage: node run-prayer-seed-full.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false }
    : { host: process.env.DB_HOST || 'localhost', port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'divineconnect',
        user: process.env.DB_USER || 'postgres', password: process.env.DB_PASSWORD || '' }
);

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'src', 'scripts', 'seed_prayers_full.sql'), 'utf-8');
  const client = await pool.connect();
  try {
    console.log('🌱 Running seed_prayers_full.sql ...');
    await client.query(sql);
    const { rows } = await client.query('SELECT COUNT(*) FROM prayers');
    console.log(`✅ Done! prayers table now has ${rows[0].count} rows.`);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}
main();
