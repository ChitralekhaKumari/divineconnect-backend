const pool = require('../config/db');

// ─── GET /api/admin/dashboard/stats ─────────────────────────────────────────
// Real counts only, per the "zero fake production data" requirement.
// Modules that don't have a table yet (pandits, astrologers, epuja, faqs,
// categories, media) are intentionally omitted rather than shown as 0 —
// a 0 implies "table exists, nothing in it yet", which would be misleading.
async function getDashboardStats(req, res) {
    try {
        const [
            { rows: userCounts },
            { rows: temples },
            { rows: recentUsers },
        ] = await Promise.all([
            pool.query(`
                SELECT
                  COUNT(*) FILTER (WHERE TRUE)                          AS total_users,
                  COUNT(*) FILTER (WHERE is_active IS NOT FALSE)        AS active_users,
                  COUNT(*) FILTER (WHERE is_verified = TRUE)            AS verified_users
                FROM users
            `),
            pool.query(`SELECT COUNT(*) AS total_temples FROM temples WHERE is_active = TRUE`),
            pool.query(`
                SELECT id, full_name, email, created_at
                FROM users ORDER BY created_at DESC LIMIT 5
            `),
        ]);

        res.json({
            success: true,
            data: {
                users: {
                    total: Number(userCounts[0].total_users),
                    active: Number(userCounts[0].active_users),
                    verified: Number(userCounts[0].verified_users),
                },
                temples: {
                    total: Number(temples[0].total_temples),
                },
                recent_users: recentUsers,
                // Modules not yet built — the admin dashboard shows these as
                // "Not yet available" rather than fabricating a count.
                modules_pending: ['pandits', 'astrologers', 'epuja', 'faqs', 'categories', 'media'],
            },
        });
    } catch (err) {
        console.error('getDashboardStats error:', err.message);
        res.status(500).json({ success: false, message: 'Could not load dashboard stats.' });
    }
}

module.exports = { getDashboardStats };
