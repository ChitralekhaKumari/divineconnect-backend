const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'divineconnect_secret_2026';

// ─── Required auth — 401s if no/invalid token ──────────────────────────────
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

// ─── Optional auth — attaches req.user if a valid token is present, ───────
// otherwise continues as a guest. Used on read endpoints that personalize
// (e.g. showing bookmarked=true) but shouldn't require login.
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
