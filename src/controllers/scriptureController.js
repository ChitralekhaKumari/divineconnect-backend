const pool = require('../config/db');

// ─── GET /api/scriptures ────────────────────────────────────────────────────
// Query params: category
async function getScriptures(req, res) {
    try {
        const category = (req.query.category || '').trim();
        const conditions = ['is_active = TRUE'];
        const params = [];

        if (category && category.toLowerCase() !== 'all') {
            params.push(category);
            conditions.push(`category = $${params.length}`);
        }

        const where = conditions.join(' AND ');

        // NOTE: chapter/verse counts are pre-aggregated in subqueries, then
        // LEFT JOINed onto scriptures — NOT joined as raw rows. Joining
        // `chapters` and `verses` directly (both on scripture_id) creates a
        // full cross-product per scripture (chapters × verses) before the
        // GROUP BY can collapse it. That's cheap for small texts (Gita:
        // 18 × ~700 = 12.6k temp rows) but explodes for large ones
        // (Ramayana: 648 × 23,291 ≈ 15 MILLION temp rows) — which is what
        // was hanging the /scriptures list page.
        const result = await pool.query(
            `SELECT
         s.id, s.slug, s.title, s.description, s.category, s.emoji, s.color,
         s.language, s.meta_labels,
         COALESCE(ch.chapter_count, 0) AS chapter_count,
         COALESCE(vs.verse_count, 0) AS verse_count
       FROM scriptures s
       LEFT JOIN (
         SELECT scripture_id, COUNT(*)::int AS chapter_count
         FROM chapters GROUP BY scripture_id
       ) ch ON ch.scripture_id = s.id
       LEFT JOIN (
         SELECT scripture_id, COUNT(*)::int AS verse_count
         FROM verses GROUP BY scripture_id
       ) vs ON vs.scripture_id = s.id
       WHERE ${where}
       ORDER BY s.display_order ASC`,
            params
        );

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('getScriptures error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── GET /api/scriptures/categories ────────────────────────────────────────
async function getCategories(req, res) {
    try {
        const result = await pool.query(
            `SELECT DISTINCT category FROM scriptures WHERE is_active = TRUE ORDER BY category`
        );
        res.json({ success: true, data: result.rows.map((r) => r.category) });
    } catch (err) {
        console.error('getCategories error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── GET /api/scriptures/random-verse ──────────────────────────────────────
async function getRandomVerse(req, res) {
    try {
        const result = await pool.query(
            `SELECT
         v.id, v.verse_number, v.sanskrit, v.transliteration, v.english, v.hindi,
         c.chapter_number, c.title AS chapter_title,
         s.slug AS scripture_slug, s.title AS scripture_title
       FROM verses v
       JOIN chapters c ON c.id = v.chapter_id
       JOIN scriptures s ON s.id = v.scripture_id
       WHERE v.english IS NOT NULL
       ORDER BY RANDOM()
       LIMIT 1`
        );

        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: 'No verses available yet.' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('getRandomVerse error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── GET /api/scriptures/search?q= ─────────────────────────────────────────
// Searches english (full-text), sanskrit + hindi (trigram similarity)
async function search(req, res) {
    try {
        const q = (req.query.q || '').trim();
        if (!q) return res.json({ success: true, data: [] });

        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT
         v.id, v.verse_number, v.sanskrit, v.transliteration, v.english, v.hindi,
         c.chapter_number, c.title AS chapter_title,
         s.slug AS scripture_slug, s.title AS scripture_title
       FROM verses v
       JOIN chapters c ON c.id = v.chapter_id
       JOIN scriptures s ON s.id = v.scripture_id
       WHERE
         to_tsvector('english', coalesce(v.english,'') || ' ' || coalesce(v.summary,'')) @@ plainto_tsquery('english', $1)
         OR v.sanskrit % $1
         OR v.hindi % $1
       ORDER BY
         ts_rank(to_tsvector('english', coalesce(v.english,'')), plainto_tsquery('english', $1)) DESC
       LIMIT $2 OFFSET $3`,
            [q, limit, offset]
        );

        res.json({ success: true, data: result.rows, page, limit });
    } catch (err) {
        console.error('search error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── GET /api/scriptures/:slug ─────────────────────────────────────────────
async function getScriptureBySlug(req, res) {
    try {
        const { slug } = req.params;

        const scriptureResult = await pool.query(
            `SELECT id, slug, title, description, category, emoji, color, language, meta_labels, source
       FROM scriptures WHERE slug = $1 AND is_active = TRUE`,
            [slug]
        );
        if (!scriptureResult.rows.length) {
            return res.status(404).json({ success: false, message: 'Scripture not found' });
        }
        const scripture = scriptureResult.rows[0];

        const chaptersResult = await pool.query(
            `SELECT id, chapter_number, title, verse_count
       FROM chapters WHERE scripture_id = $1 ORDER BY chapter_number ASC`,
            [scripture.id]
        );

        res.json({ success: true, data: { ...scripture, chapters: chaptersResult.rows } });
    } catch (err) {
        console.error('getScriptureBySlug error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── GET /api/scriptures/:slug/chapters/:chapter ───────────────────────────
// Returns chapter info + paginated verses
async function getChapterVerses(req, res) {
    try {
        const { slug, chapter } = req.params;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = (page - 1) * limit;

        const scriptureResult = await pool.query(
            `SELECT id, slug, title FROM scriptures WHERE slug = $1 AND is_active = TRUE`,
            [slug]
        );
        if (!scriptureResult.rows.length) {
            return res.status(404).json({ success: false, message: 'Scripture not found' });
        }
        const scriptureId = scriptureResult.rows[0].id;

        const chapterResult = await pool.query(
            `SELECT id, chapter_number, title, verse_count
       FROM chapters WHERE scripture_id = $1 AND chapter_number = $2`,
            [scriptureId, chapter]
        );
        if (!chapterResult.rows.length) {
            return res.status(404).json({ success: false, message: 'Chapter not found' });
        }
        const chapterRow = chapterResult.rows[0];

        const versesResult = await pool.query(
            `SELECT id, verse_number, sanskrit, transliteration, english, hindi, summary
       FROM verses WHERE chapter_id = $1 ORDER BY verse_number ASC
       LIMIT $2 OFFSET $3`,
            [chapterRow.id, limit, offset]
        );

        // Adjacent chapter numbers, for Previous/Next navigation
        const navResult = await pool.query(
            `SELECT chapter_number FROM chapters WHERE scripture_id = $1 ORDER BY chapter_number ASC`,
            [scriptureId]
        );
        const chapterNumbers = navResult.rows.map((r) => r.chapter_number);
        const idx = chapterNumbers.indexOf(chapterRow.chapter_number);

        res.json({
            success: true,
            data: {
                scripture: scriptureResult.rows[0],
                chapter: chapterRow,
                verses: versesResult.rows,
                prevChapter: idx > 0 ? chapterNumbers[idx - 1] : null,
                nextChapter: idx < chapterNumbers.length - 1 ? chapterNumbers[idx + 1] : null,
            },
            page,
            limit,
        });
    } catch (err) {
        console.error('getChapterVerses error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── POST /api/scriptures/bookmarks (auth required) ────────────────────────
// Body: { verseId }
async function addBookmark(req, res) {
    try {
        const { verseId } = req.body;
        if (!verseId) return res.status(400).json({ success: false, message: 'verseId is required' });

        await pool.query(
            `INSERT INTO bookmarks (user_id, verse_id) VALUES ($1, $2)
       ON CONFLICT (user_id, verse_id) DO NOTHING`,
            [req.user.id, verseId]
        );
        res.status(201).json({ success: true, message: 'Bookmarked.' });
    } catch (err) {
        console.error('addBookmark error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── DELETE /api/scriptures/bookmarks/:verseId (auth required) ─────────────
async function removeBookmark(req, res) {
    try {
        await pool.query(`DELETE FROM bookmarks WHERE user_id = $1 AND verse_id = $2`, [
            req.user.id,
            req.params.verseId,
        ]);
        res.json({ success: true, message: 'Bookmark removed.' });
    } catch (err) {
        console.error('removeBookmark error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── GET /api/scriptures/bookmarks (auth required) ─────────────────────────
async function getBookmarks(req, res) {
    try {
        const result = await pool.query(
            `SELECT
         v.id, v.verse_number, v.sanskrit, v.transliteration, v.english,
         c.chapter_number, s.slug AS scripture_slug, s.title AS scripture_title,
         b.created_at AS bookmarked_at
       FROM bookmarks b
       JOIN verses v ON v.id = b.verse_id
       JOIN chapters c ON c.id = v.chapter_id
       JOIN scriptures s ON s.id = v.scripture_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
            [req.user.id]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('getBookmarks error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── POST /api/scriptures/favorites (auth required) ────────────────────────
// Body: { scriptureId }
async function addFavorite(req, res) {
    try {
        const { scriptureId } = req.body;
        if (!scriptureId) return res.status(400).json({ success: false, message: 'scriptureId is required' });

        await pool.query(
            `INSERT INTO favorites (user_id, scripture_id) VALUES ($1, $2)
       ON CONFLICT (user_id, scripture_id) DO NOTHING`,
            [req.user.id, scriptureId]
        );
        res.status(201).json({ success: true, message: 'Added to favorites.' });
    } catch (err) {
        console.error('addFavorite error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── DELETE /api/scriptures/favorites/:scriptureId (auth required) ─────────
async function removeFavorite(req, res) {
    try {
        await pool.query(`DELETE FROM favorites WHERE user_id = $1 AND scripture_id = $2`, [
            req.user.id,
            req.params.scriptureId,
        ]);
        res.json({ success: true, message: 'Removed from favorites.' });
    } catch (err) {
        console.error('removeFavorite error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── GET /api/scriptures/favorites (auth required) ─────────────────────────
async function getFavorites(req, res) {
    try {
        const result = await pool.query(
            `SELECT s.id, s.slug, s.title, s.emoji, s.color, f.created_at AS favorited_at
       FROM favorites f
       JOIN scriptures s ON s.id = f.scripture_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
            [req.user.id]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('getFavorites error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── PUT /api/scriptures/progress (auth required) ──────────────────────────
// Body: { scriptureId, chapterNumber, verseNumber }
// Also serves as "recently read" — ordered by updated_at.
async function updateProgress(req, res) {
    try {
        const { scriptureId, chapterNumber, verseNumber } = req.body;
        if (!scriptureId || !chapterNumber) {
            return res.status(400).json({ success: false, message: 'scriptureId and chapterNumber are required' });
        }

        await pool.query(
            `INSERT INTO reading_progress (user_id, scripture_id, chapter_number, verse_number, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, scripture_id)
       DO UPDATE SET chapter_number = $3, verse_number = $4, updated_at = NOW()`,
            [req.user.id, scriptureId, chapterNumber, verseNumber || null]
        );
        res.json({ success: true, message: 'Progress saved.' });
    } catch (err) {
        console.error('updateProgress error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── GET /api/scriptures/recent (auth required) ────────────────────────────
async function getRecentReads(req, res) {
    try {
        const result = await pool.query(
            `SELECT
         s.slug, s.title, s.emoji, s.color,
         rp.chapter_number, rp.verse_number, rp.updated_at
       FROM reading_progress rp
       JOIN scriptures s ON s.id = rp.scripture_id
       WHERE rp.user_id = $1
       ORDER BY rp.updated_at DESC
       LIMIT 10`,
            [req.user.id]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('getRecentReads error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

module.exports = {
    getScriptures,
    getCategories,
    getRandomVerse,
    search,
    getScriptureBySlug,
    getChapterVerses,
    addBookmark,
    removeBookmark,
    getBookmarks,
    addFavorite,
    removeFavorite,
    getFavorites,
    updateProgress,
    getRecentReads,
};