const express  = require('express');
const router   = express.Router();
const {
  getTemples,
  getTempleById,
  getCategories,
  getStates,
  getFeatured,
} = require('../controllers/templeController');

router.get('/categories', getCategories);
router.get('/states',     getStates);
router.get('/featured',   getFeatured);
router.get('/',    getTemples);
router.get('/:id', getTempleById);

module.exports = router;
