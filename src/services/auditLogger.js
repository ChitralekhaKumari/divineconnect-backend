const pool = require('../config/db');

/**
 * Record an admin/user action for the audit trail.
 * Never throws — a logging failure should never break the actual request.
 *
 * @param {object} opts
 * @param {number|null} opts.userId    - who did it (null for system actions)
 * @param {string} opts.action         - e.g. 'temple.created', 'user.role_changed'
 * @param {string} [opts.entityType]   - e.g. 'temple', 'user'
 * @param {string|number} [opts.entityId]
 * @param {object} [opts.metadata]     - small JSON blob of what changed (never secrets/passwords/tokens)
 * @param {string} [opts.ipAddress]
 */
async function logAction({ userId = null, action, entityType = null, entityId = null, metadata = {}, ipAddress = null }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, entityType, entityId ? String(entityId) : null, JSON.stringify(metadata), ipAddress]
    );
  } catch (err) {
    // Deliberately swallow — audit logging must never take down the request it's logging.
    console.error('audit log write failed:', err.message);
  }
}

// Express middleware helper — pulls user id and IP off the request automatically.
function auditFromReq(req, action, entityType, entityId, metadata = {}) {
  return logAction({
    userId: req.user?.id || null,
    action,
    entityType,
    entityId,
    metadata,
    ipAddress: req.ip,
  });
}

module.exports = { logAction, auditFromReq };
