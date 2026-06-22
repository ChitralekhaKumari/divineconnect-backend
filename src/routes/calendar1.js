// divineConnect/divineconnect_backend/src/routes/calendar.js
// REPLACE your existing file with this version

const express = require('express');
const router = express.Router();
const {
  getFestivals,
  getRegions,
  getCategories,
  getUpcoming,
  getByDate,
  getFestivalById,
  addReminder,
  addFavourite,
  removeFavourite,
  getFavourites,
} = require('../controllers/calendarController');

// Festivals
router.get('/festivals/upcoming', getUpcoming);     // GET /api/calendar/festivals/upcoming?category=Islamic
router.get('/festivals/date/:date', getByDate);        // GET /api/calendar/festivals/date/2026-05-12
router.get('/regions', getRegions);       // GET /api/calendar/regions
router.get('/categories', getCategories);    // GET /api/calendar/categories
router.get('/festivals', getFestivals);     // GET /api/calendar/festivals?month=5&category=Hindu
router.get('/festivals/:id', getFestivalById);  // GET /api/calendar/festivals/3

// Reminders
router.post('/reminders', addReminder);

// Favourites
router.get('/favourites/:email', getFavourites);
router.post('/favourites', addFavourite);
router.delete('/favourites', removeFavourite);

module.exports = router;