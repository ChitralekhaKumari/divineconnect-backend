/**
 * DivineConnect – Node.js Seed Runner
 * ====================================
 * Drop this file in your existing project root (or /scripts).
 * It reads the .env file your Express server already uses,
 * connects via the same pg / Pool setup, and runs the SQL seed.
 *
 * Usage:
 *   node seed.js              (normal run – upserts all temples)
 *   node seed.js --dry-run    (parse & count rows without inserting)
 *   node seed.js --count      (print current temple count then exit)
 *
 * Dependencies:  only `pg` (already in your project) + `dotenv`
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// ── Database connection ────────────────────────────────────────────────────────
// Uses the same env vars your Express app uses.
// Adjust key names below if yours differ (e.g. DATABASE_URL vs DB_HOST).
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false }
    : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || process.env.DB_DATABASE || 'divineconnect',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    }
);

// ── Flags ──────────────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run');
const COUNT_ONLY = process.argv.includes('--count');

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getCount(client) {
  const { rows } = await client.query('SELECT COUNT(*) FROM temples');
  return parseInt(rows[0].count, 10);
}

async function main() {
  const client = await pool.connect();
  try {
    // ── Count only ──────────────────────────────────────────────────────────
    if (COUNT_ONLY) {
      const n = await getCount(client);
      console.log(`\n✅  temples table currently has ${n} rows.\n`);
      return;
    }

    // ── Dry run ─────────────────────────────────────────────────────────────
    // const sqlPath = path.join(__dirname, 'src', 'scripts', 'seed_temples.sql');
    const sqlPath = path.join(__dirname, 'src', 'scripts', 'seed_temples_phase2.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌  SQL file not found at: ${sqlPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    if (DRY_RUN) {
      // Count how many INSERT value-groups exist (very rough heuristic)
      const matches = sql.match(/^\s*\(/gm) || [];
      console.log(`\n🔎  Dry run – SQL file parsed OK.`);
      console.log(`    Approximate temple entries found in SQL: ~${Math.floor(matches.length / 2)}`);
      console.log('    No changes made to the database.\n');
      return;
    }

    // ── Real seed ───────────────────────────────────────────────────────────
    const before = await getCount(client);
    console.log(`\n🕌  Starting seed…  (current count: ${before} temples)`);

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    const after = await getCount(client);
    const added = after - before;

    console.log(`\n✅  Seed complete!`);
    console.log(`    Temples before : ${before}`);
    console.log(`    Temples after  : ${after}`);
    console.log(`    Net new rows   : ${added >= 0 ? '+' + added : added}`);
    console.log(`    (Existing rows were updated via UPSERT)\n`);

  } catch (err) {
    await client.query('ROLLBACK').catch(() => { });
    console.error('\n❌  Seed failed – rolled back.\n');
    console.error(err.message);
    if (err.position) {
      // Show a snippet of the SQL near the error position
      const pos = parseInt(err.position, 10);
      const sql = fs.readFileSync(path.join(__dirname, 'src', 'scripts', 'seed_temples.sql'), 'utf8');
      console.error('\nSQL snippet near error:');
      console.error('...' + sql.substring(Math.max(0, pos - 120), pos + 120) + '...');
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
