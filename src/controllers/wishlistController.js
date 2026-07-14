const pool = require('../config/db');

const ALLOWED_TYPES = ['prayer', 'scripture', 'temple'];

function isValidType(t) {
  return typeof t === 'string' && ALLOWED_TYPES.includes(t);
}

// ─── GET /api/wishlist (auth required) ─────────────────────────────────────
// Returns every wishlisted item for the signed-in user, newest first.
// Frontend groups these by item_type into Prayers / Scriptures / Temples.
async function getWishlist(req, res) {
  try {
    const result = await pool.query(
      `SELECT item_type, item_id, title, subtitle, image_url, meta, created_at
       FROM wishlist_items WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getWishlist error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── POST /api/wishlist (auth required) ────────────────────────────────────
// Body: { itemType, itemId, title, subtitle, imageUrl, meta }
async function addToWishlist(req, res) {
  try {
    const { itemType, itemId, title, subtitle, imageUrl, meta } = req.body;

    if (!isValidType(itemType)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing itemType.' });
    }
    if (!itemId && itemId !== 0) {
      return res.status(400).json({ success: false, message: 'itemId is required.' });
    }

    await pool.query(
      `INSERT INTO wishlist_items (user_id, item_type, item_id, title, subtitle, image_url, meta)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, item_type, item_id) DO NOTHING`,
      [req.user.id, itemType, String(itemId), title || null, subtitle || null, imageUrl || null, meta ? JSON.stringify(meta) : '{}']
    );

    res.status(201).json({ success: true, message: 'Added to wishlist.' });
  } catch (err) {
    console.error('addToWishlist error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── DELETE /api/wishlist/:itemType/:itemId (auth required) ───────────────
async function removeFromWishlist(req, res) {
  try {
    const { itemType, itemId } = req.params;

    if (!isValidType(itemType)) {
      return res.status(400).json({ success: false, message: 'Invalid itemType.' });
    }

    await pool.query(
      `DELETE FROM wishlist_items WHERE user_id = $1 AND item_type = $2 AND item_id = $3`,
      [req.user.id, itemType, String(itemId)]
    );

    res.json({ success: true, message: 'Removed from wishlist.' });
  } catch (err) {
    console.error('removeFromWishlist error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
