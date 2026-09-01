const pool = require('../config/db');

async function getBhajans(req, res) {
  try {
    const deity = (req.query.deity || '').trim();
    const search = (req.query.search || '').trim();
    const sort = (req.query.sort || 'recent').trim();

    const where = [];
    const params = [];

    if (deity && deity.toLowerCase() !== 'all') {
      params.push(deity);
      where.push(`deity ILIKE $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      where.push(`(title ILIKE $${idx} OR singer ILIKE $${idx} OR deity ILIKE $${idx} OR language ILIKE $${idx})`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const orderMap = {
      az: 'title ASC',
      recent: 'created_at DESC',
      mostplayed: 'play_count DESC',
      duration: 'duration_seconds DESC',
    };
    const orderSql = orderMap[sort] || orderMap.recent;

    const result = await pool.query(
      `SELECT id, title, deity, singer, duration_seconds, language, audio_url,
              cover_image, play_count, created_at
       FROM bhajans ${whereSql} ORDER BY ${orderSql}`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getBhajans error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── GET /api/bhajans/:id
async function getBhajanById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM bhajans WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bhajan not found.' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('getBhajanById error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── POST /api/bhajans/:id/play
async function recordPlay(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE bhajans SET play_count = play_count + 1 WHERE id = $1 RETURNING play_count',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bhajan not found.' });
    }
    res.json({ success: true, data: { play_count: result.rows[0].play_count } });
  } catch (err) {
    console.error('recordPlay error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── GET /api/bhajans/:id/recommended
async function getRecommended(req, res) {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 6, 20);

    const base = await pool.query('SELECT deity, singer FROM bhajans WHERE id = $1', [id]);
    if (base.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bhajan not found.' });
    }
    const { deity, singer } = base.rows[0];

    const result = await pool.query(
      `SELECT id, title, deity, singer, duration_seconds, language, audio_url,
              cover_image, play_count,
              CASE WHEN deity = $2 AND singer = $3 THEN 2
                   WHEN deity = $2 OR singer = $3 THEN 1
                   ELSE 0 END AS relevance
       FROM bhajans
       WHERE id != $1
       ORDER BY relevance DESC, play_count DESC
       LIMIT $4`,
      [id, deity, singer, limit]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getRecommended error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── GET /api/bhajans/meta/deities
async function getDeities(req, res) {
  try {
    const result = await pool.query('SELECT DISTINCT deity FROM bhajans ORDER BY deity ASC');
    res.json({ success: true, data: result.rows.map((r) => r.deity) });
  } catch (err) {
    console.error('getDeities error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getBhajans, getBhajanById, recordPlay, getRecommended, getDeities };
