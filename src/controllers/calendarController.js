// src/controllers/calendarController.js
// Holiday data comes from Google Calendar API (cached in google_holidays table).
// Panchang (Tithi/Nakshatra/Yoga/Karana/Muhurtas/etc.) is computed locally via
// panchangEngine.js — no external API, no cost, works fully offline.

const {
    getHolidaysForMonth,
    getHolidaysForDate,
    getUpcomingHolidays,
} = require('../services/googleCalendarService');

const { getPanchang, getMonthTithiEvents } = require('../utils/panchangEngine');

// Default location: New Delhi. Frontend can pass ?lat=&lon= for other cities.
const DEFAULT_LAT = 28.6139;
const DEFAULT_LON = 77.2090;

function parseLatLon(req) {
    const lat = req.query.lat ? parseFloat(req.query.lat) : DEFAULT_LAT;
    const lon = req.query.lon ? parseFloat(req.query.lon) : DEFAULT_LON;
    return { lat: isNaN(lat) ? DEFAULT_LAT : lat, lon: isNaN(lon) ? DEFAULT_LON : lon };
}

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

// GET /api/calendar/festivals/date/:date?lat=&lon=
async function getByDate(req, res) {
    try {
        const { date } = req.params;
        const { lat, lon } = parseLatLon(req);
        const holidays = await getHolidaysForDate(date);
        const panchang = getPanchang(date, lat, lon);
        res.json({ success: true, data: holidays.map(mapHoliday), panchang });
    } catch (err) {
        console.error('getByDate error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

// GET /api/calendar/panchang/:date?lat=&lon=
// Full Panchang for a single day — Tithi, Nakshatra, Yoga, Karana, Paksha,
// Maas, Samvatsara, sunrise/sunset, moonrise/moonset, Rahu Kaal, Yamaganda,
// Gulika Kaal, Abhijit & Brahma Muhurta, full Hora + Choghadiya tables.
async function getPanchangForDate(req, res) {
    try {
        const { date } = req.params;
        const { lat, lon } = parseLatLon(req);
        const panchang = getPanchang(date, lat, lon);
        res.json({ success: true, data: panchang });
    } catch (err) {
        console.error('getPanchangForDate error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

// GET /api/calendar/panchang/month?year=2026&month=7&lat=&lon=
// Lightweight per-day flags for the whole month — used to put Ekadashi /
// Amavasya / Purnima / Sankranti dots on the calendar grid without computing
// the full Panchang (hora/choghadiya/muhurtas) for every single day.
async function getPanchangMonthEvents(req, res) {
    try {
        const { year, month } = req.query;
        if (!year || !month) {
            return res.status(400).json({ success: false, message: 'year and month are required' });
        }
        const { lat, lon } = parseLatLon(req);
        const events = getMonthTithiEvents(Number(year), Number(month), lat, lon);
        res.json({ success: true, data: events });
    } catch (err) {
        console.error('getPanchangMonthEvents error:', err.message);
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

module.exports = { getFestivals, getByDate, getUpcoming, getPanchangForDate, getPanchangMonthEvents };
