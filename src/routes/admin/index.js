// Central mount point for all /api/admin/* module routes.
// Each module (home, temples, astrology, prayers, bhajans, scriptures,
// calendar, contact) gets its own file here as it's built out — this keeps
// the admin surface organized the same way the public API is.
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth');
const { attachRoleAndPermissions } = require('../../middleware/rbac');
const { getDashboardStats } = require('../../controllers/adminController');

const homeAdminRoutes = require('./home');
const templesAdminRoutes = require('./temples');
const prayersAdminRoutes = require('./prayers');

// Every /api/admin/* route needs: valid session → role + permissions loaded.
// Individual module routes layer requirePermission('temples.create') etc.
// on top of this. Attaching it once here means every current and future
// admin module gets RBAC for free just by mounting under this router.
router.use(requireAuth, attachRoleAndPermissions);

router.get('/dashboard/stats', getDashboardStats);

router.use('/home', homeAdminRoutes);
router.use('/temples', templesAdminRoutes);
router.use('/prayers', prayersAdminRoutes);

// router.use('/astrology', require('./astrology'));
// router.use('/prayers', require('./prayers'));
// router.use('/bhajans', require('./bhajans'));
// router.use('/scriptures', require('./scriptures'));
// router.use('/calendar', require('./calendar'));
// router.use('/contact', require('./contact'));

module.exports = router;
