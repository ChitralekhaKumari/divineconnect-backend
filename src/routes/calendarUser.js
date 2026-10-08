const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/calendarUserController');

// My events / tasks / meetings / birthdays / anniversaries
router.get('/events', requireAuth, c.listEvents);                 // ?year=2026&month=9
router.post('/events', requireAuth, c.createEvent);
router.put('/events/:id', requireAuth, c.updateEvent);
router.delete('/events/:id', requireAuth, c.deleteEvent);
router.patch('/events/:id/complete', requireAuth, c.completeTask);

// Festival e-mail reminders
router.get('/festival-reminders', requireAuth, c.listFestivalReminders);
router.post('/festival-reminders', requireAuth, c.addFestivalReminder);
router.delete('/festival-reminders/:id', requireAuth, c.removeFestivalReminder);

// Google Calendar import
router.get('/google/status', requireAuth, c.googleStatus);
router.post('/google/connect', requireAuth, c.googleConnect);
router.get('/google/callback', c.googleCallback);                 // called by Google — auth via signed `state`
router.post('/google/sync', requireAuth, c.googleSync);
router.delete('/google', requireAuth, c.googleDisconnect);

// Reminder e-mail trigger for external schedulers (Bearer CRON_SECRET)
router.get('/reminders/dispatch', c.dispatchReminders);
router.post('/reminders/dispatch', c.dispatchReminders);

module.exports = router;
