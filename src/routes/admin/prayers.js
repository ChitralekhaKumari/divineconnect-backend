const express = require('express');
const router = express.Router();
const { requirePermission } = require('../../middleware/rbac');
const {
    listPrayers, getPrayer, createPrayer, updatePrayer, deletePrayer,
} = require('../../controllers/admin/prayersAdminController');

// requireAuth + attachRoleAndPermissions already ran — see routes/admin/index.js

router.get('/', requirePermission('prayers.read'), listPrayers);
router.post('/', requirePermission('prayers.create'), createPrayer);
router.get('/:slug', requirePermission('prayers.read'), getPrayer);
router.put('/:slug', requirePermission('prayers.update'), updatePrayer);
router.delete('/:slug', requirePermission('prayers.delete'), deletePrayer);

module.exports = router;
