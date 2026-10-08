const express = require('express');
const router = express.Router();
const { requirePermission, requireRole } = require('../../middleware/rbac');
const {
  adminListTemples, adminGetTemple, adminCreateTemple, adminUpdateTemple, adminDeleteTemple,
  adminPublishTemple, adminUnpublishTemple,
  adminListTrashedTemples, adminRestoreTemple, adminPermanentlyDeleteTemple,
} = require('../../controllers/admin/templesAdminController');

// requireAuth + attachRoleAndPermissions already ran — see routes/admin/index.js

// '/trash' MUST be registered before '/:id', or Express will try to match
// the literal word "trash" as an :id parameter and hit the wrong handler.
router.get('/trash', requirePermission('temples.delete'), adminListTrashedTemples);

router.get('/', requirePermission('temples.read'), adminListTemples);
router.get('/:id', requirePermission('temples.read'), adminGetTemple);
router.post('/', requirePermission('temples.create'), adminCreateTemple);
router.put('/:id', requirePermission('temples.update'), adminUpdateTemple);
router.delete('/:id', requirePermission('temples.delete'), adminDeleteTemple);

router.patch('/:id/publish', requirePermission('temples.publish'), adminPublishTemple);
router.patch('/:id/unpublish', requirePermission('temples.publish'), adminUnpublishTemple);
router.patch('/:id/restore', requirePermission('temples.delete'), adminRestoreTemple);

// Permanent delete is extra-destructive — require SUPER_ADMIN specifically,
// not just the temples.delete permission other admin roles might also have.
router.delete('/:id/permanent', requireRole('SUPER_ADMIN'), adminPermanentlyDeleteTemple);

module.exports = router;
