// Run once: node src/scripts/seedAdmin.js
// Adds a `role` column to `users` and creates (or promotes) one admin account.
//
// Usage:
//   node src/scripts/seedAdmin.js
//   node src/scripts/seedAdmin.js --check
//   ADMIN_EMAIL=you@x.com ADMIN_PASSWORD=Something123! node src/scripts/seedAdmin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const CHECK_ONLY = process.argv.includes('--check');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@divineconnect.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe@2026';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Site Admin';

async function columnExists(client, table, column) {
    const { rows } = await client.query(
        `SELECT EXISTS (
       SELECT FROM information_schema.columns
       WHERE table_name = $1 AND column_name = $2
     )`,
        [table, column]
    );
    return rows[0].exists;
}

async function run() {
    const client = await pool.connect();
    try {
        const hasRole = await columnExists(client, 'users', 'role');

        if (CHECK_ONLY) {
            console.log('\n🔎  Checking admin setup…');
            console.log(`    users.role column : ${hasRole ? '✅ exists' : '❌ missing'}`);
            if (hasRole) {
                const { rows } = await client.query(`SELECT email FROM users WHERE role = 'admin'`);
                console.log(`    admin accounts    : ${rows.length ? rows.map(r => r.email).join(', ') : 'none yet'}`);
            }
            return;
        }

        console.log('\n🛡️   Setting up admin access…');
        await client.query('BEGIN');

        await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);

        const { rows: existing } = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [ADMIN_EMAIL]
        );

        if (existing.length) {
            await client.query(`UPDATE users SET role = 'admin', is_verified = TRUE WHERE email = $1`, [ADMIN_EMAIL]);
            console.log(`    ✅ Existing user promoted to admin: ${ADMIN_EMAIL}`);
        } else {
            const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
            await client.query(
                `INSERT INTO users (full_name, email, password_hash, is_verified, role)
         VALUES ($1, $2, $3, TRUE, 'admin')`,
                [ADMIN_NAME, ADMIN_EMAIL, hash]
            );
            console.log(`    ✅ Admin account created: ${ADMIN_EMAIL}`);
            console.log(`    🔑 Password: ${ADMIN_PASSWORD}  (change this after first login)`);
        }

        await client.query('COMMIT');
        console.log('\n🚀  Admin is ready. Log in at /admin/login with the email above.\n');
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('\n❌  Admin setup failed – rolled back.\n');
        console.error(err.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

run();
