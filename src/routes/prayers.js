const express = require('express');
const router  = express.Router();
const { getPrayers, getPrayerCategories } = require('../controllers/prayerController');

// Static routes BEFORE dynamic ones
router.get('/categories', getPrayerCategories);

// List, optionally filtered by ?category=
router.get('/', getPrayers);

module.exports = router;
