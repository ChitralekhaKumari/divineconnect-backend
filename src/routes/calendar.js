// src/routes/calendar.js
const express = require('express');
const router = express.Router();
const { getFestivals, getByDate, getUpcoming } = require('../controllers/calendarController');

router.get('/festivals/upcoming', getUpcoming);   // GET /api/calendar/festivals/upcoming?limit=6
router.get('/festivals/date/:date', getByDate);      // GET /api/calendar/festivals/date/2026-04-14
router.get('/festivals', getFestivals);   // GET /api/calendar/festivals?year=2026&month=4

module.exports = router;
