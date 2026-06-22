// divineConnect/divineconnect_backend/src/controllers/calendarController.js
// REPLACE your existing file with this version
// All festival/panchang data now comes from the DevDarsha API (cached in PostgreSQL),
// not from a manually seeded festivals table.

const { getPanchangForDate, getPanchangForMonth } = require('../services/devdarshaService');

// ─── GET /api/calendar/festivals?year=2026&month=4&city=ujjain ───────────────
// Returns every day's panchang + festivals for the given month.
// ─────────────────────────────────────────────────────────────────────────────
async function getFestivals(req, res) {
  try {
    const { year, month, city, fasting } = req.query;

    if (!year || !month) {
      return res.status(400).json({ success: false, message: 'year and month are required' });
    }

    const monthData = await getPanchangForMonth(Number(year), Number(month), city);

    // Flatten into a festival-per-row shape the frontend already expects
    let flat = [];
    for (const day of monthData) {
      const fests = day?.data?.festivals?.data || day?.festivals?.data || [];
      for (const f of fests) {
        flat.push({
          id: f.id,
          name: f.name,
          date: day.date,
          category: f.category,
          type: f.type,                 // "festival" | "vrat"
          description: f.note || '',
          fasting: f.type === 'vrat',
          tags: f.type === 'vrat' ? ['Vrat'] : [],
        });
      }
    }

    if (fasting === 'true') {
      flat = flat.filter(f => f.fasting);
    }

    res.json({ success: true, count: flat.length, data: flat });
  } catch (err) {
    console.error('getFestivals error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch festivals from DevDarsha API' });
  }
}

// ─── GET /api/calendar/festivals/date/:date?city=ujjain ──────────────────────
// Full panchang detail for one specific day (used by the selected-day panel)
// ─────────────────────────────────────────────────────────────────────────────
async function getByDate(req, res) {
  try {
    const { date } = req.params;
    const { city } = req.query;

    const day = await getPanchangForDate(date, city);
    const fests = day?.data?.festivals?.data || day?.festivals?.data || [];

    const mapped = fests.map(f => ({
      id: f.id,
      name: f.name,
      date,
      category: f.category,
      type: f.type,
      description: f.note || '',
      fasting: f.type === 'vrat',
      tags: f.type === 'vrat' ? ['Vrat'] : [],
    }));

    res.json({
      success: true,
      data: mapped,
      panchang: {
        tithi: day?.data?.tithi || day?.tithi,
        nakshatra: day?.data?.nakshatra || day?.nakshatra,
        yoga: day?.data?.yoga || day?.yoga,
        karana: day?.data?.karana || day?.karana,
        sunrise: (day?.data?.sun || day?.sun)?.rise,
        sunset: (day?.data?.sun || day?.sun)?.set,
        rahu_kaal: (day?.data?.muhurat || day?.muhurat)?.rahu_kaal,
        abhijit: (day?.data?.muhurat || day?.muhurat)?.abhijit,
        brahma_muhurat: (day?.data?.muhurat || day?.muhurat)?.brahma,
      },
    });
  } catch (err) {
    console.error('getByDate error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch panchang from DevDarsha API' });
  }
}

// ─── GET /api/calendar/festivals/upcoming?city=ujjain&limit=6 ────────────────
// Scans forward day-by-day from today until it collects `limit` festivals.
// ─────────────────────────────────────────────────────────────────────────────
async function getUpcoming(req, res) {
  try {
    const limit = Math.min(20, parseInt(req.query.limit) || 6);
    const { city, fasting } = req.query;

    const results = [];
    const cursor = new Date();
    let safety = 0; // avoid an infinite loop if the API fails repeatedly

    while (results.length < limit && safety < 90) {
      const dateStr = cursor.toISOString().slice(0, 10);
      try {
        const day = await getPanchangForDate(dateStr, city);
        const fests = day?.data?.festivals?.data || day?.festivals?.data || [];
        for (const f of fests) {
          const isFasting = f.type === 'vrat';
          if (fasting === 'true' && !isFasting) continue;
          results.push({
            id: f.id,
            name: f.name,
            date: dateStr,
            category: f.category,
            fasting: isFasting,
            tags: isFasting ? ['Vrat'] : [],
          });
          if (results.length >= limit) break;
        }
      } catch (err) {
        console.error(`Upcoming scan failed on ${dateStr}:`, err.message);
      }
      cursor.setDate(cursor.getDate() + 1);
      safety++;
    }

    res.json({ success: true, data: results.slice(0, limit) });
  } catch (err) {
    console.error('getUpcoming error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch upcoming festivals' });
  }
}

module.exports = {
  getFestivals,
  getByDate,
  getUpcoming,
};
