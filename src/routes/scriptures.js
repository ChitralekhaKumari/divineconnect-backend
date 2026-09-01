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

router.get('/categories', getCategories);
router.get('/random-verse', getRandomVerse);
router.get('/search', search);
router.get('/favorites', requireAuth, getFavorites);
router.post('/favorites', requireAuth, addFavorite);
router.delete('/favorites/:scriptureSlug', requireAuth, removeFavorite);

router.put('/progress', requireAuth, updateProgress);
router.get('/recent', requireAuth, getRecentReads);
router.get('/', getScriptures);
router.get('/:slug', getScriptureBySlug);
router.get('/:slug/chapters/:chapter', getChapterVerses);

module.exports = router;
