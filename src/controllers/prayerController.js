const pool = require('../config/db');

// ─── GET /api/prayers ──────────────────────────────────────────────────────
// Query params:
//   category (Savitri | Shiva | Hanuman | Vishnu | Lakshmi | Ganesha)
// ─────────────────────────────────────────────────────────────────────────
async function getPrayers(req, res) {
  try {
    const category = (req.query.category || '').trim();

    const conditions = ['is_active = TRUE'];
    const params = [];

    if (category && category.toLowerCase() !== 'all') {
      params.push(category);
      conditions.push(`deity = $${params.length}`);
    }

    const where = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT
         id, title, deity, frequency,
         sanskrit, transliteration, meaning, benefits
       FROM prayers
       WHERE ${where}
       ORDER BY id ASC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getPrayers error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── GET /api/prayers/categories ───────────────────────────────────────────
async function getPrayerCategories(req, res) {
  try {
    const result = await pool.query(
      `SELECT DISTINCT deity FROM prayers WHERE is_active = TRUE ORDER BY deity`
    );
    res.json({ success: true, data: result.rows.map(r => r.deity) });
  } catch (err) {
    console.error('getPrayerCategories error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getPrayers, getPrayerCategories };
