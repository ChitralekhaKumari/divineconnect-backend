/**
 * DivineConnect – Auth Tables Seed Runner
 * ========================================
 * Creates the `users` and `otps` tables needed for authentication.
 *
 * Usage:
 *   node seed_auth.js            (creates tables if they don't exist)
 *   node seed_auth.js --check    (just check if tables already exist)
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// ── Database connection ────────────────────────────────────────────────────────
const pool = new Pool(
    process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'divineconnect',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            ssl: process.env.DB_HOST && process.env.DB_HOST.includes('neon.tech')
                ? { rejectUnauthorized: false }
                : false,
        }
);

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

async function main() {
    const client = await pool.connect();
    try {
        // ── Check only ────────────────────────────────────────────────────────────
        if (CHECK_ONLY) {
            const usersOk = await tableExists(client, 'users');
            const otpsOk = await tableExists(client, 'otps');
            console.log('\n🔎  Checking auth tables…');
            console.log(`    users table : ${usersOk ? '✅ exists' : '❌ missing'}`);
            console.log(`    otps  table : ${otpsOk ? '✅ exists' : '❌ missing'}`);
            if (!usersOk || !otpsOk) {
                console.log('\n👉  Run  node seed_auth.js  to create them.\n');
            } else {
                console.log('\n✅  All auth tables are in place.\n');
            }
            return;
        }

        // ── Real run ──────────────────────────────────────────────────────────────
        const sqlPath = path.join(__dirname, 'src', 'scripts', 'seed_auth.sql');
        if (!fs.existsSync(sqlPath)) {
            console.error(`❌  SQL file not found at: ${sqlPath}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('\n🔐  Running auth tables migration…');

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');

        const usersOk = await tableExists(client, 'users');
        const otpsOk = await tableExists(client, 'otps');

        console.log('\n✅  Auth migration complete!');
        console.log(`    users table : ${usersOk ? '✅ ready' : '❌ failed'}`);
        console.log(`    otps  table : ${otpsOk ? '✅ ready' : '❌ failed'}`);
        console.log('\n🚀  You can now start the server and use Sign Up / Sign In.\n');

    } catch (err) {
        await client.query('ROLLBACK').catch(() => { });
        console.error('\n❌  Migration failed – rolled back.\n');
        console.error(err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

main();