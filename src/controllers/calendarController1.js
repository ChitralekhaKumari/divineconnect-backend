// divineConnect/divineconnect_backend/src/controllers/calendarController.js
// REPLACE your existing file with this version

const pool = require('../config/db');

// ─── GET /api/calendar/festivals ─────────────────────────────────────────────
// Query params: month, year, fasting=true, region, category (Hindu/Islamic/Sikh/Christian/Jain/Buddhist/Parsi/National)
// ─────────────────────────────────────────────────────────────────────────────
async function getFestivals(req, res) {
  try {
    const { month, year, fasting, region, category } = req.query;

    const conditions = ['is_active = TRUE'];
    const params = [];

    if (year) {
      params.push(year);
      conditions.push(`EXTRACT(YEAR FROM date) = $${params.length}`);
    }
    if (month) {
      params.push(month);
      conditions.push(`EXTRACT(MONTH FROM date) = $${params.length}`);
    }
    if (fasting === 'true') {
      conditions.push(`fasting = TRUE`);
    }
    if (region) {
      params.push(region);
      conditions.push(`region = $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    const where = conditions.join(' AND ');
    const result = await pool.query(
      `SELECT * FROM festivals WHERE ${where} ORDER BY date ASC`,
      params
    );

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('getFestivals error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ─── GET /api/calendar/regions ────────────────────────────────────────────────
async function getRegions(req, res) {
  try {
    const result = await pool.query(
      `SELECT DISTINCT region FROM festivals WHERE is_active = TRUE ORDER BY region ASC`
    );
    res.json({ success: true, data: result.rows.map(r => r.region) });
  } catch (err) {
    console.error('getRegions error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ─── GET /api/calendar/categories ─────────────────────────────────────────────
async function getCategories(req, res) {
  try {
    const result = await pool.query(
      `SELECT DISTINCT category FROM festivals WHERE is_active = TRUE ORDER BY category ASC`
    );
    res.json({ success: true, data: result.rows.map(r => r.category) });
  } catch (err) {
    console.error('getCategories error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ─── GET /api/calendar/festivals/upcoming ────────────────────────────────────
async function getUpcoming(req, res) {
  try {
    const limit = Math.min(20, parseInt(req.query.limit) || 6);
    const { fasting, region, category } = req.query;

    const conditions = ['date >= CURRENT_DATE', 'is_active = TRUE'];
    const params = [];

    if (fasting === 'true') conditions.push('fasting = TRUE');
    if (region) {
      params.push(region);
      conditions.push(`region = $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    params.push(limit);

    const result = await pool.query(
      `SELECT * FROM festivals WHERE ${conditions.join(' AND ')}
       ORDER BY date ASC LIMIT $${params.length}`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getUpcoming error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ─── GET /api/calendar/festivals/date/:date ──────────────────────────────────
async function getByDate(req, res) {
  try {
    const { date } = req.params;
    const result = await pool.query(
      `SELECT * FROM festivals WHERE date = $1 AND is_active = TRUE ORDER BY id ASC`,
      [date]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getByDate error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ─── GET /api/calendar/festivals/:id ─────────────────────────────────────────
async function getFestivalById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM festivals WHERE id = $1 AND is_active = TRUE`,
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Festival not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('getFestivalById error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ─── POST /api/calendar/reminders ────────────────────────────────────────────
async function addReminder(req, res) {
  try {
    const { festival_id, user_email, remind_days = 1 } = req.body;
    if (!festival_id || !user_email)
      return res.status(400).json({ success: false, message: 'festival_id and user_email are required' });

    const result = await pool.query(
      `INSERT INTO calendar_reminders (festival_id, user_email, remind_days)
       VALUES ($1, $2, $3) RETURNING *`,
      [festival_id, user_email, remind_days]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('addReminder error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ─── POST /api/calendar/favourites ───────────────────────────────────────────
async function addFavourite(req, res) {
  try {
    const { festival_id, user_email } = req.body;
    if (!festival_id || !user_email)
      return res.status(400).json({ success: false, message: 'festival_id and user_email are required' });

    await pool.query(
      `INSERT INTO calendar_favourites (festival_id, user_email)
       VALUES ($1, $2) ON CONFLICT (festival_id, user_email) DO NOTHING`,
      [festival_id, user_email]
    );
    res.status(201).json({ success: true, message: 'Added to favourites' });
  } catch (err) {
    console.error('addFavourite error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ─── DELETE /api/calendar/favourites ─────────────────────────────────────────
async function removeFavourite(req, res) {
  try {
    const { festival_id, user_email } = req.body;
    await pool.query(
      `DELETE FROM calendar_favourites WHERE festival_id = $1 AND user_email = $2`,
      [festival_id, user_email]
    );
    res.json({ success: true, message: 'Removed from favourites' });
  } catch (err) {
    console.error('removeFavourite error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ─── GET /api/calendar/favourites/:email ─────────────────────────────────────
async function getFavourites(req, res) {
  try {
    const { email } = req.params;
    const result = await pool.query(
      `SELECT f.* FROM festivals f
       JOIN calendar_favourites cf ON cf.festival_id = f.id
       WHERE cf.user_email = $1 AND f.is_active = TRUE
       ORDER BY f.date ASC`,
      [email]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getFavourites error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = {
  getFestivals,
  getRegions,
  getCategories,
  getUpcoming,
  getByDate,
  getFestivalById,
  addReminder,
  addFavourite,
  removeFavourite,
  getFavourites,
};