const express = require('express');
const router = express.Router();
const {
  getTemples,
  getTempleById,
  getCategories,
  getStates,
  getDeities,
  getFeatured,
  getSimilarTemples,
} = require('../controllers/templeController');

// Static routes BEFORE dynamic :id
router.get('/categories', getCategories);
router.get('/states', getStates);
router.get('/deities', getDeities);
router.get('/featured', getFeatured);

// Paginated list with search/filter
router.get('/', getTemples);

// Similar temples — two segments, so it never collides with '/:id' below
router.get('/:id/similar', getSimilarTemples);

// Single temple detail
router.get('/:id', getTempleById);

module.exports = router;
