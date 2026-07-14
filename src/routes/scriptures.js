const express = require('express');
const router = express.Router();
const {
    getScriptures,
    getCategories,
    getRandomVerse,
    search,
    getScriptureBySlug,
    getChapterVerses,
    addFavorite,
    removeFavorite,
    getFavorites,
    updateProgress,
    getRecentReads,
} = require('../controllers/scriptureController');
const { requireAuth } = require('../middleware/auth');

// Static routes BEFORE dynamic ones
router.get('/categories', getCategories);
router.get('/random-verse', getRandomVerse);
router.get('/search', search);

// User-specific (auth required) — also static, must precede /:slug
router.get('/favorites', requireAuth, getFavorites);
router.post('/favorites', requireAuth, addFavorite);
router.delete('/favorites/:scriptureSlug', requireAuth, removeFavorite);

router.put('/progress', requireAuth, updateProgress);
router.get('/recent', requireAuth, getRecentReads);

// List, optionally filtered by ?category=
router.get('/', getScriptures);

// Dynamic — must come after all static routes above
router.get('/:slug', getScriptureBySlug);
router.get('/:slug/chapters/:chapter', getChapterVerses);

module.exports = router;
