/**
 * Create-or-reset an admin account with a password you choose — bypasses
 * the signup/OTP flow, for local development convenience only.
 *
 * Run:
 *   node src/scripts/setAdminPassword.js you@example.com MyPassword123 SUPER_ADMIN
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function run() {
  const [, , email, password, roleName = 'SUPER_ADMIN'] = process.argv;
  if (!email || !password) {
    console.error('Usage: node src/scripts/setAdminPassword.js <email> <password> [ROLE_NAME]');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters.');
    process.exit(1);
  }

  try {
    const { rows: roleRows } = await pool.query('SELECT id FROM roles WHERE name = $1', [roleName.toUpperCase()]);
    if (!roleRows.length) {
      console.error(`❌ Unknown role "${roleName}". Run npm run db:migrate:rbac first.`);
      process.exit(1);
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);

    if (existing.length) {
      await pool.query(
        `UPDATE users SET password_hash = $1, role_id = $2, is_verified = TRUE, is_active = TRUE WHERE email = $3`,
        [hash, roleRows[0].id, email.toLowerCase()]
      );
      console.log(`✅ Password reset for ${email}. Role: ${roleName.toUpperCase()}`);
    } else {
      await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role_id, is_verified, is_active)
         VALUES ($1, $2, $3, $4, TRUE, TRUE)`,
        ['Admin', email.toLowerCase(), hash, roleRows[0].id]
      );
      console.log(`✅ Admin account created: ${email} / role ${roleName.toUpperCase()}`);
    }
    console.log(`   Log in at /admin/login with the email and password you just set.`);
  } catch (err) {
    console.error('❌ Failed:', err.message);
  } finally {
    await pool.end();
  }
}

run();