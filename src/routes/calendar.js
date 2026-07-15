// src/routes/calendar.js
const express = require('express');
const router = express.Router();
const {
    getFestivals, getByDate, getUpcoming,
    getPanchangForDate, getPanchangMonthEvents,
} = require('../controllers/calendarController');

router.get('/festivals/upcoming', getUpcoming);      // GET /api/calendar/festivals/upcoming?limit=6
router.get('/festivals/date/:date', getByDate);      // GET /api/calendar/festivals/date/2026-04-14?lat=&lon=
router.get('/festivals', getFestivals);              // GET /api/calendar/festivals?year=2026&month=4

router.get('/panchang/month', getPanchangMonthEvents); // GET /api/calendar/panchang/month?year=2026&month=7&lat=&lon=
router.get('/panchang/:date', getPanchangForDate);      // GET /api/calendar/panchang/2026-07-14?lat=&lon=

module.exports = router;
