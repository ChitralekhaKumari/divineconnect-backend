const express = require('express');
const router = express.Router();
const { getPrayers, getPrayerCategories, getPrayerBySlug } = require('../controllers/prayerController');

router.get('/categories', getPrayerCategories);
router.get('/', getPrayers);
router.get('/:slug', getPrayerBySlug);
module.exports = router;
