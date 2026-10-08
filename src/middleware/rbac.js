const pool = require('../config/db');

// In-memory cache of role → permission keys, refreshed periodically so we
// don't hit the DB on every single request. Fine for this app's scale;
// revisit with a proper cache (Redis) if roles start changing very often.
let permissionCache = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60 * 1000;

async function loadPermissionMap() {
  if (permissionCache && Date.now() < cacheExpiresAt) return permissionCache;

  const { rows } = await pool.query(`
    SELECT r.name AS role, p.key AS permission
    FROM role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    JOIN permissions p ON p.id = rp.permission_id
  `);

  const map = {};
  for (const row of rows) {
    if (!map[row.role]) map[row.role] = new Set();
    map[row.role].add(row.permission);
  }
  permissionCache = map;
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return map;
}

// Call this after changing role_permissions from an admin endpoint so the
// next request sees fresh data instead of waiting out the TTL.
function invalidatePermissionCache() {
  permissionCache = null;
}

// ─── Attaches req.user.role and req.user.permissions (Set) ────────────────
// Must run AFTER requireAuth (needs req.user.id already set from the JWT).
async function attachRoleAndPermissions(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT r.name AS role, u.is_active
       FROM users u LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (rows.length === 0 || rows[0].is_active === false) {
      return res.status(401).json({ success: false, message: 'Account not found or deactivated.' });
    }

    const role = rows[0].role || 'USER';
    const map = await loadPermissionMap();

    req.user.role = role;
    req.user.permissions = map[role] || new Set();
    next();
  } catch (err) {
    console.error('attachRoleAndPermissions error:', err.message);
    res.status(500).json({ success: false, message: 'Could not verify permissions.' });
  }
}

// ─── Guard: require one specific permission key ────────────────────────────
// Usage: router.post('/temples', requireAuth, attachRoleAndPermissions, requirePermission('temples.create'), handler)
function requirePermission(permissionKey) {
  return (req, res, next) => {
    if (!req.user?.permissions) {
      return res.status(500).json({ success: false, message: 'Permissions not loaded — check middleware order.' });
    }
    if (!req.user.permissions.has(permissionKey)) {
      return res.status(403).json({ success: false, message: `Missing required permission: ${permissionKey}` });
    }
    next();
  };
}

// ─── Guard: require one of a list of roles ─────────────────────────────────
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(500).json({ success: false, message: 'Role not loaded — check middleware order.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this resource.' });
    }
    next();
  };
}

module.exports = {
  attachRoleAndPermissions,
  requirePermission,
  requireRole,
  invalidatePermissionCache,
};
