const pool = require('../config/db');

async function getTemples(req, res) {
  try {
    const page     = Math.max(1, parseInt(req.query.page)  || 1);
    const limit    = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const offset   = (page - 1) * limit;
    const search   = (req.query.search   || '').trim();
    const category = (req.query.category || '').trim();
    const tag      = (req.query.tag      || '').trim();
    const state    = (req.query.state    || '').trim();
    const sort     = req.query.sort || 'id';

    const allowedSorts = { rating: 'rating DESC', reviews: 'reviews DESC', name: 'name ASC', id: 'id ASC' };
    const orderBy = allowedSorts[sort] || 'id ASC';

    const conditions = ['is_active = TRUE'];
    const params     = [];

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(
        name           ILIKE $${idx} OR
        deity          ILIKE $${idx} OR
        location_city  ILIKE $${idx} OR
        location_state ILIKE $${idx} OR
        famous_for     ILIKE $${idx}
      )`);
    }

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    if (tag) {
      params.push(tag);
      conditions.push(`tag = $${params.length}`);
    }

    if (state) {
      params.push(`%${state}%`);
      conditions.push(`location_state ILIKE $${params.length}`);
    }

    const where = conditions.join(' AND ');

    // Count total for pagination meta
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM temples WHERE ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Fetch page
    const dataResult = await pool.query(
      `SELECT
         id, name, alternate_name, deity, other_deities, category,
         location_city, location_state, full_address, latitude, longitude,
         timings_general, timings_morning_aarti, timings_evening_aarti,
         entry_fee, dress_code, famous_for, best_time_visit,
         festivals, contact_phone, website, image_url, tag, rating, reviews
       FROM temples
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error('getTemples error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── GET /api/temples/:id ─────────────────────────────────────────────────────
async function getTempleById(req, res) {
  try {
    const { id } = req.params;
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: 'Invalid temple ID' });
    }

    const result = await pool.query(
      `SELECT * FROM temples WHERE id = $1 AND is_active = TRUE`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Temple not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('getTempleById error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── GET /api/temples/categories ─────────────────────────────────────────────
async function getCategories(req, res) {
  try {
    const result = await pool.query(
      `SELECT category, COUNT(*) AS count
       FROM temples WHERE is_active = TRUE
       GROUP BY category ORDER BY count DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── GET /api/temples/states ──────────────────────────────────────────────────
async function getStates(req, res) {
  try {
    const result = await pool.query(
      `SELECT DISTINCT location_state AS state, COUNT(*) AS count
       FROM temples WHERE is_active = TRUE AND location_state IS NOT NULL
       GROUP BY location_state ORDER BY location_state`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── GET /api/temples/featured ───────────────────────────────────────────────
async function getFeatured(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, deity, location_city, location_state, image_url, tag, rating, reviews, timings_general
       FROM temples WHERE is_active = TRUE AND tag IN ('LIVE','FEATURED')
       ORDER BY reviews DESC LIMIT 8`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getTemples, getTempleById, getCategories, getStates, getFeatured };
