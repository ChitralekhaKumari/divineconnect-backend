const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../../middleware/auth');
const {
    listPrayers, getPrayer, createPrayer, updatePrayer, deletePrayer,
} = require('../../controllers/admin/prayersAdminController');

router.use(requireAdmin);

router.get('/', listPrayers);
router.post('/', createPrayer);
router.get('/:slug', getPrayer);
router.put('/:slug', updatePrayer);
router.delete('/:slug', deletePrayer);

module.exports = router;
