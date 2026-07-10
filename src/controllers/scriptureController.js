const pool = require('../config/db');
const { loadScriptures, loadAllVersesFlat } = require('../utils/scriptureLoader');


function getScriptures(req, res) {
    try {
        const category = (req.query.category || '').trim();
        let scriptures = loadScriptures();

        if (category && category.toLowerCase() !== 'all') {
            scriptures = scriptures.filter((s) => s.category.toLowerCase() === category.toLowerCase());
        }

        const data = scriptures.map((s) => ({
            id: s.id,
            slug: s.slug,
            title: s.title,
            description: s.description,
            category: s.category,
            emoji: s.emoji,
            color: s.color,
            language: s.language,
            meta_labels: s.meta_labels,
            chapter_count: s.chapters.length,
            verse_count: s.chapters.reduce((sum, c) => sum + c.verses.length, 0),
        }));

        res.json({ success: true, data });
    } catch (err) {
        console.error('getScriptures error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── GET /api/scriptures/categories ────────────────────────────────────────
function getCategories(req, res) {
    try {
        const scriptures = loadScriptures();
        const categories = [...new Set(scriptures.map((s) => s.category))].sort();
        res.json({ success: true, data: categories });
    } catch (err) {
        console.error('getCategories error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── GET /api/scriptures/random-verse ──────────────────────────────────────
function getRandomVerse(req, res) {
    try {
        const verses = loadAllVersesFlat().filter((v) => v.english);
        if (!verses.length) {
            return res.status(404).json({ success: false, message: 'No verses available yet.' });
        }
        const verse = verses[Math.floor(Math.random() * verses.length)];
        res.json({ success: true, data: verse });
    } catch (err) {
        console.error('getRandomVerse error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── GET /api/scriptures/search?q= ─────────────────────────────────────────
// Simple in-memory, case-insensitive substring search across english,
// sanskrit, hindi, and summary — content set is small enough (no verses
// table, no DB round-trip) that this doesn't need Postgres full-text search.
function search(req, res) {
    try {
        const qRaw = (req.query.q || '').trim();
        const q = qRaw.toLowerCase();
        if (!q) return res.json({ success: true, data: [] });

        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const offset = (page - 1) * limit;

        const matches = loadAllVersesFlat().filter((v) => {
            return (
                (v.english && v.english.toLowerCase().includes(q)) ||
                (v.summary && v.summary.toLowerCase().includes(q)) ||
                (v.sanskrit && v.sanskrit.includes(qRaw)) ||
                (v.hindi && v.hindi.includes(qRaw))
            );
        });

        res.json({ success: true, data: matches.slice(offset, offset + limit), page, limit });
    } catch (err) {
        console.error('search error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── GET /api/scriptures/:slug ─────────────────────────────────────────────
function getScriptureBySlug(req, res) {
    try {
        const { slug } = req.params;
        const scripture = loadScriptures().find((s) => s.slug === slug);

        if (!scripture) {
            return res.status(404).json({ success: false, message: 'Scripture not found' });
        }

        res.json({
            success: true,
            data: {
                id: scripture.id,
                slug: scripture.slug,
                title: scripture.title,
                description: scripture.description,
                category: scripture.category,
                emoji: scripture.emoji,
                color: scripture.color,
                language: scripture.language,
                meta_labels: scripture.meta_labels,
                source: scripture.source,
                chapters: scripture.chapters.map((c) => ({
                    chapter_number: c.chapter_number,
                    title: c.title,
                    verse_count: c.verse_count,
                })),
            },
        });
    } catch (err) {
        console.error('getScriptureBySlug error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── GET /api/scriptures/:slug/chapters/:chapter ───────────────────────────
function getChapterVerses(req, res) {
    try {
        const { slug, chapter } = req.params;
        const chapterNumber = parseInt(chapter, 10);
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = (page - 1) * limit;

        const scripture = loadScriptures().find((s) => s.slug === slug);
        if (!scripture) {
            return res.status(404).json({ success: false, message: 'Scripture not found' });
        }

        const chapterRow = scripture.chapters.find((c) => c.chapter_number === chapterNumber);
        if (!chapterRow) {
            return res.status(404).json({ success: false, message: 'Chapter not found' });
        }

        const chapterNumbers = scripture.chapters.map((c) => c.chapter_number);
        const idx = chapterNumbers.indexOf(chapterNumber);

        res.json({
            success: true,
            data: {
                scripture: { id: scripture.id, slug: scripture.slug, title: scripture.title },
                chapter: {
                    chapter_number: chapterRow.chapter_number,
                    title: chapterRow.title,
                    verse_count: chapterRow.verse_count,
                },
                verses: chapterRow.verses.slice(offset, offset + limit),
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
// Body: { scriptureSlug, chapterNumber, verseNumber }
async function addBookmark(req, res) {
    try {
        const { scriptureSlug, chapterNumber, verseNumber } = req.body;
        if (!scriptureSlug || !chapterNumber || !verseNumber) {
            return res.status(400).json({
                success: false,
                message: 'scriptureSlug, chapterNumber and verseNumber are required',
            });
        }

        await pool.query(
            `INSERT INTO scripture_bookmarks (user_id, scripture_slug, chapter_number, verse_number)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, scripture_slug, chapter_number, verse_number) DO NOTHING`,
            [req.user.id, scriptureSlug, chapterNumber, verseNumber]
        );
        res.status(201).json({ success: true, message: 'Bookmarked.' });
    } catch (err) {
        console.error('addBookmark error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── DELETE /api/scriptures/bookmarks/:scriptureSlug/:chapterNumber/:verseNumber (auth required)
async function removeBookmark(req, res) {
    try {
        const { scriptureSlug, chapterNumber, verseNumber } = req.params;
        await pool.query(
            `DELETE FROM scripture_bookmarks
       WHERE user_id = $1 AND scripture_slug = $2 AND chapter_number = $3 AND verse_number = $4`,
            [req.user.id, scriptureSlug, chapterNumber, verseNumber]
        );
        res.json({ success: true, message: 'Bookmark removed.' });
    } catch (err) {
        console.error('removeBookmark error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── GET /api/scriptures/bookmarks (auth required) ─────────────────────────
// Joins each stored (slug, chapter, verse) back against the .md content so
// the response still carries the verse text, not just the identifying keys.
async function getBookmarks(req, res) {
    try {
        const result = await pool.query(
            `SELECT scripture_slug, chapter_number, verse_number, created_at
       FROM scripture_bookmarks WHERE user_id = $1 ORDER BY created_at DESC`,
            [req.user.id]
        );

        const scriptures = loadScriptures();
        const data = result.rows.map((b) => {
            const scripture = scriptures.find((s) => s.slug === b.scripture_slug);
            const chapterRow = scripture?.chapters.find((c) => c.chapter_number === b.chapter_number);
            const verse = chapterRow?.verses.find((v) => v.verse_number === b.verse_number);
            return {
                scripture_slug: b.scripture_slug,
                scripture_title: scripture?.title || b.scripture_slug,
                chapter_number: b.chapter_number,
                chapter_title: chapterRow?.title || null,
                verse_number: b.verse_number,
                sanskrit: verse?.sanskrit || null,
                transliteration: verse?.transliteration || null,
                english: verse?.english || null,
                bookmarked_at: b.created_at,
            };
        });

        res.json({ success: true, data });
    } catch (err) {
        console.error('getBookmarks error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── POST /api/scriptures/favorites (auth required) ────────────────────────
// Body: { scriptureSlug }
async function addFavorite(req, res) {
    try {
        const { scriptureSlug } = req.body;
        if (!scriptureSlug) return res.status(400).json({ success: false, message: 'scriptureSlug is required' });

        await pool.query(
            `INSERT INTO scripture_favorites (user_id, scripture_slug) VALUES ($1, $2)
       ON CONFLICT (user_id, scripture_slug) DO NOTHING`,
            [req.user.id, scriptureSlug]
        );
        res.status(201).json({ success: true, message: 'Added to favorites.' });
    } catch (err) {
        console.error('addFavorite error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// ─── DELETE /api/scriptures/favorites/:scriptureSlug (auth required) ───────
async function removeFavorite(req, res) {
    try {
        await pool.query(`DELETE FROM scripture_favorites WHERE user_id = $1 AND scripture_slug = $2`, [
            req.user.id,
            req.params.scriptureSlug,
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
            `SELECT scripture_slug, created_at FROM scripture_favorites WHERE user_id = $1 ORDER BY created_at DESC`,
            [req.user.id]
        );

        const scriptures = loadScriptures();
        const data = result.rows.map((f) => {
            const scripture = scriptures.find((s) => s.slug === f.scripture_slug);
            return {
                slug: f.scripture_slug,
                title: scripture?.title || f.scripture_slug,
                emoji: scripture?.emoji || null,
                color: scripture?.color || null,
                favorited_at: f.created_at,
            };
        });

        res.json({ success: true, data });
    } catch (err) {
        console.error('getFavorites error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}


async function updateProgress(req, res) {
    try {
        const { scriptureSlug, chapterNumber, verseNumber } = req.body;
        if (!scriptureSlug || !chapterNumber) {
            return res.status(400).json({ success: false, message: 'scriptureSlug and chapterNumber are required' });
        }

        await pool.query(
            `INSERT INTO scripture_reading_progress (user_id, scripture_slug, chapter_number, verse_number, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, scripture_slug)
       DO UPDATE SET chapter_number = $3, verse_number = $4, updated_at = NOW()`,
            [req.user.id, scriptureSlug, chapterNumber, verseNumber || null]
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
            `SELECT scripture_slug, chapter_number, verse_number, updated_at
       FROM scripture_reading_progress WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 10`,
            [req.user.id]
        );

        const scriptures = loadScriptures();
        const data = result.rows.map((rp) => {
            const scripture = scriptures.find((s) => s.slug === rp.scripture_slug);
            return {
                slug: rp.scripture_slug,
                title: scripture?.title || rp.scripture_slug,
                emoji: scripture?.emoji || null,
                color: scripture?.color || null,
                chapter_number: rp.chapter_number,
                verse_number: rp.verse_number,
                updated_at: rp.updated_at,
            };
        });

        res.json({ success: true, data });
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
