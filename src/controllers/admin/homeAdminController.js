const pool = require('../../config/db');

const CONTENT_FIELDS = [
    'hero_title', 'hero_title_highlight', 'hero_description', 'hero_image_url',
    'hero_cta_text', 'hero_cta_link',
    'astrology_label', 'astrology_title', 'astrology_title_highlight', 'astrology_description',
    'astrology_image_url', 'astrology_cta_text', 'astrology_cta_link',
];

// ─── GET /api/admin/home  — full content for the editor form
async function getContent(req, res) {
    try {
        const { rows } = await pool.query('SELECT * FROM home_content WHERE id = 1');
        res.json({ success: true, data: rows[0] || null });
    } catch (err) {
        console.error('admin getContent error:', err);
        res.status(500).json({ success: false, message: 'Could not load home content.' });
    }
}

// ─── PUT /api/admin/home  — update hero + astrology CTA copy
async function updateContent(req, res) {
    try {
        const updates = {};
        for (const field of CONTENT_FIELDS) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }
        const keys = Object.keys(updates);
        if (keys.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields provided.' });
        }

        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const values = keys.map((k) => updates[k]);

        const { rows } = await pool.query(
            `UPDATE home_content SET ${setClause}, updated_at = NOW() WHERE id = 1 RETURNING *`,
            values
        );
        res.json({ success: true, message: 'Home content updated.', data: rows[0] });
    } catch (err) {
        console.error('admin updateContent error:', err);
        res.status(500).json({ success: false, message: 'Could not update home content.' });
    }
}

// ─── GET /api/admin/home/stats
async function listStats(req, res) {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM home_stats ORDER BY display_order ASC, id ASC'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('admin listStats error:', err);
        res.status(500).json({ success: false, message: 'Could not load stats.' });
    }
}

// ─── POST /api/admin/home/stats
async function createStat(req, res) {
    try {
        const { value, label, display_order = 0, is_active = true } = req.body;
        if (!value || !label) {
            return res.status(400).json({ success: false, message: 'value and label are required.' });
        }
        const { rows } = await pool.query(
            `INSERT INTO home_stats (value, label, display_order, is_active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [value, label, display_order, is_active]
        );
        res.status(201).json({ success: true, message: 'Stat added.', data: rows[0] });
    } catch (err) {
        console.error('admin createStat error:', err);
        res.status(500).json({ success: false, message: 'Could not add stat.' });
    }
}

// ─── PUT /api/admin/home/stats/:id
async function updateStat(req, res) {
    try {
        const { id } = req.params;
        const { value, label, display_order, is_active } = req.body;

        const { rows } = await pool.query(
            `UPDATE home_stats SET
         value = COALESCE($1, value),
         label = COALESCE($2, label),
         display_order = COALESCE($3, display_order),
         is_active = COALESCE($4, is_active)
       WHERE id = $5 RETURNING *`,
            [value, label, display_order, is_active, id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Stat not found.' });
        res.json({ success: true, message: 'Stat updated.', data: rows[0] });
    } catch (err) {
        console.error('admin updateStat error:', err);
        res.status(500).json({ success: false, message: 'Could not update stat.' });
    }
}

// ─── DELETE /api/admin/home/stats/:id
async function deleteStat(req, res) {
    try {
        const { id } = req.params;
        const { rowCount } = await pool.query('DELETE FROM home_stats WHERE id = $1', [id]);
        if (!rowCount) return res.status(404).json({ success: false, message: 'Stat not found.' });
        res.json({ success: true, message: 'Stat deleted.' });
    } catch (err) {
        console.error('admin deleteStat error:', err);
        res.status(500).json({ success: false, message: 'Could not delete stat.' });
    }
}

// ─── GET /api/admin/home/sections
async function listSections(req, res) {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM home_sections ORDER BY display_order ASC, id ASC'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('admin listSections error:', err);
        res.status(500).json({ success: false, message: 'Could not load sections.' });
    }
}

// ─── PUT /api/admin/home/sections/:key  — toggle visibility and/or reorder
async function updateSection(req, res) {
    try {
        const { key } = req.params;
        const { is_active, display_order } = req.body;

        const { rows } = await pool.query(
            `UPDATE home_sections SET
         is_active = COALESCE($1, is_active),
         display_order = COALESCE($2, display_order)
       WHERE section_key = $3 RETURNING *`,
            [is_active, display_order, key]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Section not found.' });
        res.json({ success: true, message: 'Section updated.', data: rows[0] });
    } catch (err) {
        console.error('admin updateSection error:', err);
        res.status(500).json({ success: false, message: 'Could not update section.' });
    }
}

// ─── PUT /api/admin/home/sections/reorder  — bulk reorder from a drag-and-drop list
// body: { order: ['hero', 'astrology_cta', 'temples', ...] }
async function reorderSections(req, res) {
    const client = await pool.connect();
    try {
        const { order } = req.body;
        if (!Array.isArray(order) || order.length === 0) {
            return res.status(400).json({ success: false, message: 'order must be a non-empty array of section_key.' });
        }

        await client.query('BEGIN');
        for (let i = 0; i < order.length; i++) {
            await client.query(
                'UPDATE home_sections SET display_order = $1 WHERE section_key = $2',
                [i + 1, order[i]]
            );
        }
        await client.query('COMMIT');

        const { rows } = await pool.query('SELECT * FROM home_sections ORDER BY display_order ASC');
        res.json({ success: true, message: 'Sections reordered.', data: rows });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('admin reorderSections error:', err);
        res.status(500).json({ success: false, message: 'Could not reorder sections.' });
    } finally {
        client.release();
    }
}

module.exports = {
    getContent, updateContent,
    listStats, createStat, updateStat, deleteStat,
    listSections, updateSection, reorderSections,
};
