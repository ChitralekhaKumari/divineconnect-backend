const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../../middleware/auth');
const {
    getContent, updateContent,
    listStats, createStat, updateStat, deleteStat,
    listSections, updateSection, reorderSections,
} = require('../../controllers/admin/homeAdminController');

router.use(requireAdmin);

router.get('/', getContent);
router.put('/', updateContent);

router.get('/stats', listStats);
router.post('/stats', createStat);
router.put('/stats/:id', updateStat);
router.delete('/stats/:id', deleteStat);

router.get('/sections', listSections);
router.put('/sections/reorder', reorderSections); // must come before /:key
router.put('/sections/:key', updateSection);

module.exports = router;
