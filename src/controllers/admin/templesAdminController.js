const pool = require('../../config/db');

const EDITABLE_FIELDS = [
    'name', 'alternate_name', 'deity', 'other_deities', 'category',
    'location_city', 'location_state', 'full_address', 'latitude', 'longitude',
    'timings_general', 'timings_morning_aarti', 'timings_evening_aarti', 'timings_closed_on',
    'entry_fee', 'dress_code', 'special_darshan', 'famous_for', 'history', 'best_time_visit',
    'festivals', 'contact_phone', 'website', 'image_url', 'tag', 'rating', 'reviews',
    'pincode', 'nearest_railway', 'nearest_airport',
];

// ─── GET /api/admin/temples  — includes inactive temples, unlike the public endpoint
async function listTemples(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const search = (req.query.search || '').trim();
        const status = req.query.status || 'all'; // 'all' | 'active' | 'inactive'

        const conditions = [];
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            const idx = params.length;
            conditions.push(`(name ILIKE $${idx} OR deity ILIKE $${idx} OR location_city ILIKE $${idx} OR location_state ILIKE $${idx})`);
        }
        if (status === 'active') conditions.push('is_active = TRUE');
        if (status === 'inactive') conditions.push('is_active = FALSE');

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const countResult = await pool.query(`SELECT COUNT(*) FROM temples ${where}`, params);
        const total = parseInt(countResult.rows[0].count);

        const dataResult = await pool.query(
            `SELECT id, name, deity, location_city, location_state, tag, rating, reviews, image_url, is_active, updated_at
       FROM temples ${where}
       ORDER BY id ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, limit, offset]
        );

        res.json({
            success: true,
            data: dataResult.rows,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error('admin listTemples error:', err);
        res.status(500).json({ success: false, message: 'Could not load temples.' });
    }
}

// ─── GET /api/admin/temples/:id  — full record, for the edit form
async function getTemple(req, res) {
    try {
        const { rows } = await pool.query('SELECT * FROM temples WHERE id = $1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Temple not found.' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('admin getTemple error:', err);
        res.status(500).json({ success: false, message: 'Could not load temple.' });
    }
}

// ─── POST /api/admin/temples
async function createTemple(req, res) {
    try {
        const { name, location_city } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Temple name is required.' });
        }

        const fields = EDITABLE_FIELDS.filter((f) => req.body[f] !== undefined);
        const columns = ['name', ...fields.filter((f) => f !== 'name')];
        const values = columns.map((c) => (c === 'name' ? name.trim() : req.body[c]));
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        const { rows } = await pool.query(
            `INSERT INTO temples (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
            values
        );
        res.status(201).json({ success: true, message: 'Temple added.', data: rows[0] });
    } catch (err) {
        console.error('admin createTemple error:', err);
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: 'A temple with this name already exists in that city.' });
        }
        res.status(500).json({ success: false, message: 'Could not add temple.' });
    }
}

// ─── PUT /api/admin/temples/:id
async function updateTemple(req, res) {
    try {
        const { id } = req.params;
        const updates = {};
        for (const field of EDITABLE_FIELDS) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }
        const keys = Object.keys(updates);
        if (keys.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields provided.' });
        }

        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const values = keys.map((k) => updates[k]);

        const { rows } = await pool.query(
            `UPDATE temples SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
            [...values, id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Temple not found.' });
        res.json({ success: true, message: 'Temple updated.', data: rows[0] });
    } catch (err) {
        console.error('admin updateTemple error:', err);
        res.status(500).json({ success: false, message: 'Could not update temple.' });
    }
}

// ─── PATCH /api/admin/temples/:id/active  — soft delete / restore (hides from the live site instantly)
async function setActive(req, res) {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ success: false, message: 'is_active must be true or false.' });
        }
        const { rows } = await pool.query(
            'UPDATE temples SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, is_active',
            [is_active, id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Temple not found.' });
        res.json({ success: true, message: is_active ? 'Temple restored.' : 'Temple hidden from the live site.', data: rows[0] });
    } catch (err) {
        console.error('admin setActive error:', err);
        res.status(500).json({ success: false, message: 'Could not update temple status.' });
    }
}

// ─── DELETE /api/admin/temples/:id  — permanent delete
async function deleteTemple(req, res) {
    try {
        const { rowCount } = await pool.query('DELETE FROM temples WHERE id = $1', [req.params.id]);
        if (!rowCount) return res.status(404).json({ success: false, message: 'Temple not found.' });
        res.json({ success: true, message: 'Temple permanently deleted.' });
    } catch (err) {
        console.error('admin deleteTemple error:', err);
        res.status(500).json({ success: false, message: 'Could not delete temple.' });
    }
}

module.exports = { listTemples, getTemple, createTemple, updateTemple, setActive, deleteTemple };
