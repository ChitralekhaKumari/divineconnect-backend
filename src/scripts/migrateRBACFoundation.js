/**
 * Phase 0 — RBAC + Audit foundations.
 *
 * Creates:
 *   roles              (SUPER_ADMIN, ADMIN, CONTENT_MANAGER, EDITOR, MODERATOR, SUPPORT, USER)
 *   permissions        (temples.create, temples.publish, media.upload, ...)
 *   role_permissions   (join table)
 *   audit_logs         (who did what, to what, when)
 * Alters:
 *   users              + role_id FK (defaults every existing user to USER),
 *                       + is_active, + last_login_at
 *
 * Safe to run multiple times — everything is IF NOT EXISTS / ON CONFLICT.
 *
 * Run:
 *   node src/scripts/migrateRBACFoundation.js
 */
require('dotenv').config();
const pool = require('../config/db');

const ROLES = [
  { name: 'SUPER_ADMIN',     description: 'Full unrestricted access to everything, including role/permission management.' },
  { name: 'ADMIN',           description: 'Full content and user management, cannot manage roles/permissions.' },
  { name: 'CONTENT_MANAGER', description: 'Create, edit, publish and unpublish all content types.' },
  { name: 'EDITOR',          description: 'Create and edit content; cannot publish or delete.' },
  { name: 'MODERATOR',       description: 'Review and moderate user-submitted content.' },
  { name: 'SUPPORT',         description: 'Read-only access to users and content for support purposes.' },
  { name: 'USER',            description: 'Regular public user — the default role for every signup.' },
];

// One permission key per module x action. Keep this list append-only as new
// modules are added (Phase 4+) — never renumber/reuse an existing key.
const MODULES = [
  'users', 'roles', 'home', 'temples', 'categories', 'faqs', 'pandits', 'astrologers',
  'epuja', 'scriptures', 'prayers', 'bhajans', 'festivals', 'media', 'settings', 'audit_logs',
];
const ACTIONS = ['read', 'create', 'update', 'delete', 'publish'];

function buildPermissions() {
  const perms = [];
  for (const mod of MODULES) {
    for (const action of ACTIONS) {
      // Not every module needs every action (e.g. audit_logs has no 'create')
      if (['audit_logs', 'settings'].includes(mod) && !['read', 'update'].includes(action)) continue;
      if (['media'].includes(mod) && !['read', 'create', 'delete'].includes(action)) continue;
      perms.push(`${mod}.${action === 'create' && mod === 'media' ? 'upload' : action}`);
    }
  }
  return [...new Set(perms)];
}

// Which roles get which permissions
const ROLE_PERMISSION_MAP = {
  SUPER_ADMIN: '*', // gets every permission that exists
  ADMIN: (key) => !key.startsWith('roles.'),
  CONTENT_MANAGER: (key) => !key.startsWith('users.') && !key.startsWith('roles.') && !key.startsWith('settings.'),
  EDITOR: (key) => (key.endsWith('.read') || key.endsWith('.create') || key.endsWith('.update'))
    && !key.startsWith('users.') && !key.startsWith('roles.') && !key.startsWith('settings.') && !key.startsWith('audit_logs.'),
  MODERATOR: (key) => key.endsWith('.read') || key.endsWith('.update'),
  SUPPORT: (key) => key.endsWith('.read'),
  USER: () => false,
};

const SQL_TABLES = `
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id   SERIAL PRIMARY KEY,
  key  VARCHAR(100) UNIQUE NOT NULL   -- e.g. 'temples.create'
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INTEGER,               -- nullable: system actions have no user
  action      VARCHAR(100) NOT NULL, -- e.g. 'temple.created', 'user.role_changed'
  entity_type VARCHAR(50),
  entity_id   VARCHAR(50),
  metadata    JSONB DEFAULT '{}',
  ip_address  VARCHAR(64),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role_id       INTEGER REFERENCES roles(id),
  ADD COLUMN IF NOT EXISTS is_active     BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Creating RBAC + audit tables...');
    await client.query(SQL_TABLES);

    console.log('Seeding roles...');
    for (const r of ROLES) {
      await client.query(
        `INSERT INTO roles (name, description) VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
        [r.name, r.description]
      );
    }

    console.log('Seeding permissions...');
    const permissionKeys = buildPermissions();
    for (const key of permissionKeys) {
      await client.query(`INSERT INTO permissions (key) VALUES ($1) ON CONFLICT (key) DO NOTHING`, [key]);
    }

    console.log('Mapping role → permissions...');
    const { rows: roles } = await client.query('SELECT id, name FROM roles');
    const { rows: perms } = await client.query('SELECT id, key FROM permissions');

    for (const role of roles) {
      const rule = ROLE_PERMISSION_MAP[role.name];
      const grantedPerms = rule === '*' ? perms : perms.filter(p => rule(p.key));
      for (const p of grantedPerms) {
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [role.id, p.id]
        );
      }
      console.log(`  ${role.name}: ${grantedPerms.length} permissions`);
    }

    console.log('Assigning default USER role to existing users without one...');
    const userRole = roles.find(r => r.name === 'USER');
    await client.query(`UPDATE users SET role_id = $1 WHERE role_id IS NULL`, [userRole.id]);

    console.log('✅ Phase 0 complete. Roles, permissions, and audit_logs are ready.');
    console.log('   To make a user an admin, run: node src/scripts/promoteUser.js <email> SUPER_ADMIN');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
