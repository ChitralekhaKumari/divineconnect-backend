// Central mount point for all /api/admin/* module routes.
// Each module (home, temples, astrology, prayers, bhajans, scriptures,
// calendar, contact) gets its own file here as it's built out — this keeps
// the admin surface organized the same way the public API is.
const express = require('express');
const router = express.Router();

const homeAdminRoutes = require('./home');
const templesAdminRoutes = require('./temples');
const prayersAdminRoutes = require('./prayers');

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
