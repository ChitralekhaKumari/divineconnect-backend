const pool = require('../config/db');

// ─── GET /api/home
// Aggregated content for the public Home page: hero + astrology CTA copy,
// active stats (ordered), and active sections (ordered) so the frontend
// knows what to render and in what sequence. Admin edits flow through here
// automatically — no redeploy needed.
async function getHomeContent(req, res) {
    try {
        const contentResult = await pool.query('SELECT * FROM home_content WHERE id = 1');
        const statsResult = await pool.query(
            'SELECT id, value, label FROM home_stats WHERE is_active = TRUE ORDER BY display_order ASC, id ASC'
        );
        const sectionsResult = await pool.query(
            'SELECT section_key, label, is_active, display_order FROM home_sections ORDER BY display_order ASC, id ASC'
        );

        res.json({
            success: true,
            data: {
                content: contentResult.rows[0] || null,
                stats: statsResult.rows,
                sections: sectionsResult.rows,
            },
        });
    } catch (err) {
        console.error('getHomeContent error:', err);
        res.status(500).json({ success: false, message: 'Could not load home content.' });
    }
}

module.exports = { getHomeContent };
