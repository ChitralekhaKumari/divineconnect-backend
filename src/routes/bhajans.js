const express = require('express');
const router = express.Router();
const {
  getBhajans,
  getBhajanById,
  recordPlay,
  getRecommended,
  getDeities,
} = require('../controllers/bhajanController');

router.get('/', getBhajans);
router.get('/meta/deities', getDeities);
router.get('/:id', getBhajanById);
router.get('/:id/recommended', getRecommended);
router.post('/:id/play', recordPlay);

module.exports = router;
