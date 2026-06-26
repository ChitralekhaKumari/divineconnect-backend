// src/controllers/calendarController.js
// All holiday data now comes from Google Calendar API (cached in google_holidays table).

const {
    getHolidaysForMonth,
    getHolidaysForDate,
    getUpcomingHolidays,
} = require('../services/googleCalendarService');

function mapHoliday(h) {
    return {
        id: h.id,
        name: h.name,
        date: h.date,
        description: h.description || '',
        fasting: false,
        tags: [],
        category: 'National',
        type: 'holiday',
    };
}

// GET /api/calendar/festivals?year=2026&month=4
async function getFestivals(req, res) {
    try {
        const { year, month } = req.query;
        if (!year || !month) {
            return res.status(400).json({ success: false, message: 'year and month are required' });
        }
        const holidays = await getHolidaysForMonth(Number(year), Number(month));
        res.json({ success: true, count: holidays.length, data: holidays.map(mapHoliday) });
    } catch (err) {
        console.error('getFestivals error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

// GET /api/calendar/festivals/date/:date
async function getByDate(req, res) {
    try {
        const { date } = req.params;
        const holidays = await getHolidaysForDate(date);
        res.json({ success: true, data: holidays.map(mapHoliday), panchang: null });
    } catch (err) {
        console.error('getByDate error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

// GET /api/calendar/festivals/upcoming?limit=6
async function getUpcoming(req, res) {
    try {
        const limit = Math.min(20, parseInt(req.query.limit) || 6);
        const holidays = await getUpcomingHolidays(limit);
        res.json({ success: true, data: holidays.map(mapHoliday) });
    } catch (err) {
        console.error('getUpcoming error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { getFestivals, getByDate, getUpcoming };
