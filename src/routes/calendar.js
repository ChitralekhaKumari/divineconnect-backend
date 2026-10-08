const express = require('express');
const router = express.Router();
const {
    getFestivals, getRegionalFestivals, getByDate, getUpcoming,
    getPanchangForDate, getPanchangMonthEvents, getPanchangMonthDays,
} = require('../controllers/calendarController');

// Logged-in features: my events, festival reminders, Google Calendar import
router.use(require('./calendarUser'));

router.get('/festivals/upcoming', getUpcoming);      // GET /api/calendar/festivals/upcoming?limit=6
router.get('/festivals/date/:date', getByDate);      // GET /api/calendar/festivals/date/2026-04-14?lat=&lon=
router.get('/festivals/regional', getRegionalFestivals); // GET /api/calendar/festivals/regional?tradition=telugu&year=2026&month=9
router.get('/festivals', getFestivals);              // GET /api/calendar/festivals?year=2026&month=4

router.get('/panchang/month-days', getPanchangMonthDays); // GET /api/calendar/panchang/month-days?year=2026&month=7&lat=&lon=
router.get('/panchang/month', getPanchangMonthEvents); // GET /api/calendar/panchang/month?year=2026&month=7&lat=&lon=
router.get('/panchang/:date', getPanchangForDate);      // GET /api/calendar/panchang/2026-07-14?lat=&lon=

module.exports = router;
