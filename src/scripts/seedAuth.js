require('dotenv').config();
const pool = require('../config/db');


const SEED_SQL = `
-- ─── Users Table ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  full_name       VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  is_verified     BOOLEAN DEFAULT FALSE,
  avatar_url      TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─── OTP Table ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otps (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(255) NOT NULL,
  otp         VARCHAR(6) NOT NULL,
  type        VARCHAR(30) NOT NULL, -- 'email_verify' | 'forgot_password'
  expires_at  TIMESTAMP NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otps_email_type ON otps (email, type);
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

async function seedAuth() {
    const client = await pool.connect();
    try {
        // ── Check only — inspect without touching the database ──────────
        if (CHECK_ONLY) {
            const usersOk = await tableExists(client, 'users');
            const otpsOk = await tableExists(client, 'otps');
            console.log('\n🔎  Checking auth tables…');
            console.log(`    users table : ${usersOk ? '✅ exists' : '❌ missing'}`);
            console.log(`    otps  table : ${otpsOk ? '✅ exists' : '❌ missing'}`);
            if (!usersOk || !otpsOk) {
                console.log('\n👉  Run  node src/scripts/seedAuth.js  to create them.\n');
            } else {
                console.log('\n✅  All auth tables are in place.\n');
            }
            return;
        }

        // ── Real run, wrapped in a transaction so a bad statement rolls ──
        // back everything instead of leaving schema half-created.
        console.log('\n🔐  Running auth tables migration…');

        await client.query('BEGIN');
        await client.query(SEED_SQL);
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
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

seedAuth();