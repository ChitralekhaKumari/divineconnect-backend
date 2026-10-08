// Verifies JWT token for protected routes.
//
// NOTE (RBAC migration): this file used to also export `requireAdmin`,
// which checked a flat `role: 'admin'` claim baked into the JWT itself.
// That's gone now — role/permission checks live in `middleware/rbac.js`
// (attachRoleAndPermissions + requireRole/requirePermission), which look
// the user's role up fresh from the `roles`/`role_permissions` tables on
// every request instead of trusting a possibly-stale JWT claim. This means
// a role change (or deactivation) takes effect immediately, without the
// user needing to log out and back in.
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwt');

const JWT_SECRET = getJwtSecret();

// ─── Required auth — 401s if no/invalid token
function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) return res.status(401).json({ success: false, message: 'Login required.' });

    try {
        req.user = jwt.verify(token, JWT_SECRET); // { id, email, full_name }
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
}

// ─── Optional auth — attaches req.user if a valid token is present
function optionalAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
        try {
            req.user = jwt.verify(token, JWT_SECRET);
        } catch {
            // ignore invalid token, proceed as guest
        }
    }
    next();
}

module.exports = { requireAuth, optionalAuth };
