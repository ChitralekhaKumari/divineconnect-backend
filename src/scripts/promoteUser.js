/**
 * Set a user's role by email. Use this to create your first admin account
 * after registering normally through the public signup form.
 *
 * Run:
 *   node src/scripts/promoteUser.js you@example.com SUPER_ADMIN
 */
require('dotenv').config();
const pool = require('../config/db');

async function run() {
  const [, , email, roleName] = process.argv;
  if (!email || !roleName) {
    console.error('Usage: node src/scripts/promoteUser.js <email> <ROLE_NAME>');
    console.error('Roles: SUPER_ADMIN, ADMIN, CONTENT_MANAGER, EDITOR, MODERATOR, SUPPORT, USER');
    process.exit(1);
  }

  try {
    const { rows: roleRows } = await pool.query('SELECT id FROM roles WHERE name = $1', [roleName.toUpperCase()]);
    if (roleRows.length === 0) {
      console.error(`❌ Unknown role "${roleName}". Run the RBAC migration first if you haven't.`);
      process.exitCode = 1;
      return;
    }

    const { rows } = await pool.query(
      `UPDATE users SET role_id = $1 WHERE email = $2 RETURNING id, full_name, email`,
      [roleRows[0].id, email.toLowerCase()]
    );

    if (rows.length === 0) {
      console.error(`❌ No user found with email "${email}". Register that account first.`);
    } else {
      console.log(`✅ ${rows[0].full_name} (${rows[0].email}) is now ${roleName.toUpperCase()}`);
    }
  } catch (err) {
    console.error('❌ Failed:', err.message);
  } finally {
    await pool.end();
  }
}

run();
