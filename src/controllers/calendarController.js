const {
    getHolidaysForMonth,
    getHolidaysForDate,
    getUpcomingHolidays,
} = require('../services/googleCalendarService');

const { getPanchang, getMonthTithiEvents, getMonthPanchangDays } = require('../utils/panchangEngine');
const { TRADITIONS, getRegionalFestivals: lookupRegionalFestivals } = require('../data/regionalFestivals');

// Default location: New Delhi. 
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

// GET /api/calendar/panchang/month-days?year=2026&month=7&lat=&lon=
// Compact per-day Panchang (tithi/paksha/nakshatra) for every day in the
// month — used by calendar-grid views. Lighter than /panchang/:date x N.
async function getPanchangMonthDays(req, res) {
    try {
        const { year, month } = req.query;
        if (!year || !month) {
            return res.status(400).json({ success: false, message: 'year and month are required' });
        }
        const { lat, lon } = parseLatLon(req);
        const days = getMonthPanchangDays(Number(year), Number(month), lat, lon);
        res.json({ success: true, data: days });
    } catch (err) {
        console.error('getPanchangMonthDays error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

// GET /api/calendar/festivals/regional?tradition=telugu&year=2026&month=9
// Tradition-specific festivals (Telugu, Tamil, Kannada, ...). Dates are computed
// from lunisolar rules, so any year works. `month` is optional (omit for the full year).
function getRegionalFestivals(req, res) {
    try {
        const tradition = String(req.query.tradition || '').toLowerCase();
        if (!TRADITIONS.includes(tradition)) {
            return res.status(400).json({
                success: false,
                message: `tradition must be one of: ${TRADITIONS.join(', ')}`,
            });
        }
        const year = parseInt(req.query.year, 10);
        if (isNaN(year) || year < 1950 || year > 2100) {
            return res.status(400).json({ success: false, message: 'a valid year is required' });
        }
        let month = null;
        if (req.query.month !== undefined && req.query.month !== '') {
            month = parseInt(req.query.month, 10);
            if (isNaN(month) || month < 1 || month > 12) {
                return res.status(400).json({ success: false, message: 'month must be 1-12' });
            }
        }
        const data = lookupRegionalFestivals(tradition, year, month);
        res.json({ success: true, tradition, count: data.length, data });
    } catch (err) {
        console.error('getRegionalFestivals error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { getFestivals, getRegionalFestivals, getByDate, getUpcoming, getPanchangForDate, getPanchangMonthEvents, getPanchangMonthDays };
