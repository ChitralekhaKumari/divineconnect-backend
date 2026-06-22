const express  = require('express');
const router   = express.Router();
const {
  getTemples,
  getTempleById,
  getCategories,
  getStates,
  getFeatured,
} = require('../controllers/templeController');

// Static routes BEFORE dynamic :id
router.get('/categories', getCategories);
router.get('/states',     getStates);
router.get('/featured',   getFeatured);

// Paginated list with search/filter
router.get('/',    getTemples);

// Single temple detail
router.get('/:id', getTempleById);

module.exports = router;
