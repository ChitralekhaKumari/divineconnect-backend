const pool = require('../../config/db');
const { auditFromReq } = require('../../services/auditLogger');

function slugify(name, id) {
  const base = name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return `${base}-${id}`;
}

// Whitelist of columns an admin form is allowed to write. Never build the
// UPDATE/INSERT from `Object.keys(req.body)` directly — that's a
// mass-assignment vulnerability (a request could otherwise overwrite id,
// created_at, or any future column just by including it in the JSON body).
const EDITABLE_FIELDS = [
  'name', 'alternate_name', 'deity', 'other_deities', 'category',
  'location_city', 'location_state', 'full_address', 'latitude', 'longitude',
  'timings_general', 'timings_morning_aarti', 'timings_evening_aarti', 'timings_closed_on',
  'entry_fee', 'dress_code', 'special_darshan', 'famous_for', 'history', 'best_time_visit',
  'festivals', 'contact_phone', 'website', 'image_url', 'tag', 'rating', 'reviews',
  'pincode', 'nearest_railway', 'nearest_airport', 'seo_title', 'seo_description',
  // sidebar-detail fields (AP Temples-portal style)
  'sevas', 'darshan_types', 'accommodation_info', 'donation_info', 'how_to_reach',
  'gallery_images', 'temple_trust', 'online_services',
  // AP-TMS-style fields
  'temple_activities', 'annadanam_info', 'hundi_info', 'guidelines', 'adopted_temples',
  'temple_members', 'rituals', 'muttams_peetams', 'transport_info', 'distance_info',
];

const JSONB_FIELDS = new Set([
  'sevas', 'darshan_types', 'online_services', 'temple_activities',
  'adopted_temples', 'temple_members', 'rituals',
]);
const ARRAY_FIELDS = new Set(['other_deities', 'festivals', 'guidelines', 'gallery_images']);

function sanitizeBody(body) {
  const clean = {};
  for (const key of EDITABLE_FIELDS) {
    if (body[key] === undefined) continue;
    if (JSONB_FIELDS.has(key)) {
      clean[key] = JSON.stringify(body[key] ?? (Array.isArray(body[key]) ? [] : {}));
    } else if (ARRAY_FIELDS.has(key)) {
      clean[key] = Array.isArray(body[key]) ? body[key] : [];
    } else {
      clean[key] = body[key];
    }
  }
  return clean;
}

// ─── GET /api/admin/temples — not-trashed temples, any draft/published status
async function adminListTemples(req, res) {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const status = (req.query.status || '').trim(); // 'draft' | 'published' | ''

    const conditions = ['is_active = TRUE'];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR deity ILIKE $${params.length} OR location_city ILIKE $${params.length} OR location_state ILIKE $${params.length})`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    const where = conditions.join(' AND ');

    const countResult = await pool.query(`SELECT COUNT(*) FROM temples WHERE ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT id, name, deity, category, location_city, location_state, status, image_url, rating, updated_at
       FROM temples WHERE ${where}
       ORDER BY updated_at DESC NULLS LAST, id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    console.error('adminListTemples error:', err.message);
    res.status(500).json({ success: false, message: 'Could not load temples.' });
  }
}

// ─── GET /api/admin/temples/trash — soft-deleted temples ───────────────────
// Registered before '/:id' in the route file, or Express matches "trash"
// as an :id param instead of hitting this handler.
async function adminListTrashedTemples(req, res) {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(`SELECT COUNT(*) FROM temples WHERE is_active = FALSE`);
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT id, name, deity, category, location_city, location_state, image_url, rating, updated_at
       FROM temples WHERE is_active = FALSE
       ORDER BY updated_at DESC NULLS LAST LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    console.error('adminListTrashedTemples error:', err.message);
    res.status(500).json({ success: false, message: 'Could not load trash.' });
  }
}

// ─── GET /api/admin/temples/:id — full record, for the edit form ───────────
async function adminGetTemple(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM temples WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Temple not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('adminGetTemple error:', err.message);
    res.status(500).json({ success: false, message: 'Could not load temple.' });
  }
}

// ─── POST /api/admin/temples ────────────────────────────────────────────────
async function adminCreateTemple(req, res) {
  try {
    if (!req.body.name || !String(req.body.name).trim()) {
      return res.status(422).json({ success: false, message: 'Temple name is required.', errors: [{ field: 'name', message: 'Required' }] });
    }

    const clean = sanitizeBody(req.body);
    // New temples default to draft — an admin has to make a conscious
    // "Publish" action for it to reach the public site.
    clean.status = 'draft';
    clean.is_active = true;
    clean.created_by = req.user.id;

    const fields = Object.keys(clean);
    const placeholders = fields.map((_, i) => `$${i + 1}`);

    const { rows } = await pool.query(
      `INSERT INTO temples (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      Object.values(clean)
    );
    const temple = rows[0];
    await pool.query('UPDATE temples SET slug = $1 WHERE id = $2', [slugify(temple.name, temple.id), temple.id]);

    auditFromReq(req, 'temple.created', 'temple', temple.id, { name: temple.name });
    res.status(201).json({ success: true, data: { ...temple, slug: slugify(temple.name, temple.id) }, message: 'Temple created as draft.' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'A temple with this name already exists in that city.' });
    }
    console.error('adminCreateTemple error:', err.message);
    res.status(500).json({ success: false, message: 'Could not create temple.' });
  }
}

// ─── PUT /api/admin/temples/:id ─────────────────────────────────────────────
async function adminUpdateTemple(req, res) {
  try {
    const { id } = req.params;
    const clean = sanitizeBody(req.body);

    if (Object.keys(clean).length === 0) {
      return res.status(422).json({ success: false, message: 'No valid fields provided to update.' });
    }

    const fields = Object.keys(clean);
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');

    const { rows } = await pool.query(
      `UPDATE temples SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
      [...Object.values(clean), id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Temple not found.' });

    auditFromReq(req, 'temple.updated', 'temple', id, { fields });
    res.json({ success: true, data: rows[0], message: 'Temple updated.' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'A temple with this name already exists in that city.' });
    }
    console.error('adminUpdateTemple error:', err.message);
    res.status(500).json({ success: false, message: 'Could not update temple.' });
  }
}

// ─── DELETE /api/admin/temples/:id — soft delete → lands in Recycle Bin ────
async function adminDeleteTemple(req, res) {
  try {
    const { rows } = await pool.query(
      `UPDATE temples SET is_active = FALSE, status = 'archived', updated_at = NOW() WHERE id = $1 RETURNING id, name`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Temple not found.' });

    auditFromReq(req, 'temple.deleted', 'temple', req.params.id, { name: rows[0].name });
    res.json({ success: true, message: 'Temple moved to Recycle Bin.' });
  } catch (err) {
    console.error('adminDeleteTemple error:', err.message);
    res.status(500).json({ success: false, message: 'Could not delete temple.' });
  }
}

// ─── PATCH /api/admin/temples/:id/restore — bring it back as a draft ──────
// Restores to 'draft', not 'published' — an admin decides when it's ready
// to go live again rather than it silently reappearing on the public site.
async function adminRestoreTemple(req, res) {
  try {
    const { rows } = await pool.query(
      `UPDATE temples SET is_active = TRUE, status = 'draft', updated_at = NOW()
       WHERE id = $1 AND is_active = FALSE RETURNING id, name`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Temple not found in trash.' });

    auditFromReq(req, 'temple.restored', 'temple', req.params.id, { name: rows[0].name });
    res.json({ success: true, data: rows[0], message: 'Temple restored as a draft.' });
  } catch (err) {
    console.error('adminRestoreTemple error:', err.message);
    res.status(500).json({ success: false, message: 'Could not restore temple.' });
  }
}

// ─── DELETE /api/admin/temples/:id/permanent — actually gone, no undo ─────
async function adminPermanentlyDeleteTemple(req, res) {
  try {
    const { rows } = await pool.query(
      `DELETE FROM temples WHERE id = $1 AND is_active = FALSE RETURNING id, name`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Temple not found in trash (only trashed temples can be permanently deleted).',
      });
    }

    auditFromReq(req, 'temple.permanently_deleted', 'temple', req.params.id, { name: rows[0].name });
    res.json({ success: true, message: `"${rows[0].name}" was permanently deleted.` });
  } catch (err) {
    console.error('adminPermanentlyDeleteTemple error:', err.message);
    res.status(500).json({ success: false, message: 'Could not permanently delete temple.' });
  }
}

// ─── PATCH /api/admin/temples/:id/publish ───────────────────────────────────
async function adminPublishTemple(req, res) {
  try {
    const { rows } = await pool.query(
      `UPDATE temples SET status = 'published', updated_at = NOW() WHERE id = $1 RETURNING id, name, status`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Temple not found.' });

    auditFromReq(req, 'temple.published', 'temple', req.params.id, { name: rows[0].name });
    res.json({ success: true, data: rows[0], message: 'Temple published.' });
  } catch (err) {
    console.error('adminPublishTemple error:', err.message);
    res.status(500).json({ success: false, message: 'Could not publish temple.' });
  }
}

// ─── PATCH /api/admin/temples/:id/unpublish ─────────────────────────────────
async function adminUnpublishTemple(req, res) {
  try {
    const { rows } = await pool.query(
      `UPDATE temples SET status = 'draft', updated_at = NOW() WHERE id = $1 RETURNING id, name, status`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Temple not found.' });

    auditFromReq(req, 'temple.unpublished', 'temple', req.params.id, { name: rows[0].name });
    res.json({ success: true, data: rows[0], message: 'Temple unpublished.' });
  } catch (err) {
    console.error('adminUnpublishTemple error:', err.message);
    res.status(500).json({ success: false, message: 'Could not unpublish temple.' });
  }
}

module.exports = {
  adminListTemples, adminGetTemple, adminCreateTemple, adminUpdateTemple, adminDeleteTemple,
  adminPublishTemple, adminUnpublishTemple,
  adminListTrashedTemples, adminRestoreTemple, adminPermanentlyDeleteTemple,
};
