const express = require('express');
const router = express.Router();
const { requirePermission } = require('../../middleware/rbac');
const {
    getContent, updateContent,
    listStats, createStat, updateStat, deleteStat,
    listSections, updateSection, reorderSections,
} = require('../../controllers/admin/homeAdminController');

// requireAuth + attachRoleAndPermissions already ran — see routes/admin/index.js

router.get('/', requirePermission('home.read'), getContent);
router.put('/', requirePermission('home.update'), updateContent);

router.get('/stats', requirePermission('home.read'), listStats);
router.post('/stats', requirePermission('home.create'), createStat);
router.put('/stats/:id', requirePermission('home.update'), updateStat);
router.delete('/stats/:id', requirePermission('home.delete'), deleteStat);

router.get('/sections', requirePermission('home.read'), listSections);
router.put('/sections/reorder', requirePermission('home.update'), reorderSections); // must come before /:key
router.put('/sections/:key', requirePermission('home.update'), updateSection);

module.exports = router;
