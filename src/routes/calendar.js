// divineConnect/divineconnect_backend/src/routes/calendar.js
// REPLACE your existing file with this version

const express = require('express');
const router  = express.Router();
const {
  getFestivals,
  getByDate,
  getUpcoming,
} = require('../controllers/calendarController');

router.get('/festivals/upcoming',   getUpcoming);     // GET /api/calendar/festivals/upcoming?city=ujjain&limit=6
router.get('/festivals/date/:date', getByDate);        // GET /api/calendar/festivals/date/2026-04-15?city=ujjain
router.get('/festivals',            getFestivals);     // GET /api/calendar/festivals?year=2026&month=4&city=ujjain

module.exports = router;
