const express = require('express');
const router = express.Router();
const { getPrayers, getPrayerCategories, getPrayerBySlug } = require('../controllers/prayerController');

// Static routes BEFORE dynamic ones
router.get('/categories', getPrayerCategories);

// List, optionally filtered by ?category=
router.get('/', getPrayers);

// Single prayer by slug or id (optional — for direct linking)
router.get('/:slug', getPrayerBySlug);

module.exports = router;
