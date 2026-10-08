// Computes the Gregorian date of regional (tradition-specific) festivals for
// any year from rule definitions — so dates stay correct year after year
// without a hand-maintained table.
//
// Rule kinds (see data/regionalFestivals.js for the builders):
//   L  – lunar:   amanta month + tithi number + time-of-day the tithi must prevail
//   LS – lunar tithi that falls inside a given solar month (e.g. Vaikuntha Ekadashi)
//   S  – solar:   first day of a solar month (Sun's sankranti) + offset in days
//   N  – nakshatra inside a solar month (Onam, Karthigai Deepam, Thai Poosam …)
//   W  – nearest weekday before / on-after / after another rule's date (Varalakshmi Vratam, Bonalu)
//   D  – another rule's date + offset
//   FX – fixed Gregorian date (Lohri, Nanakshahi dates)
//
// Everything is evaluated in IST. Regional practice can differ from the
// computed date by a day in some years (tithi sighting, local sunrise) —
// same caveat every printed panchang carries.

const Astronomy = require('astronomy-engine');
const { ayanamsa } = require('./panchangEngine');

const DAY = 86400000;
const IST_MS = 5.5 * 3600000;

// Amanta lunar months, Chaitra first.
const MASA = [
    'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada',
    'Ashwin', 'Kartik', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna',
];

// Hour (IST, from local midnight) at which a tithi/nakshatra must be running
// for a festival to be assigned to that civil day.
const AT_HOURS = {
    dawn: 5, sunrise: 6, purvahna: 9, noon: 12, aparahna: 14.5,
    pradosh: 18.5, moonrise: 20, midnight: 24,
};

// ── date helpers ────────────────────────────────────────────────────────────
const norm = (x) => ((x % 360) + 360) % 360;
const istDay = (date) => new Date(date.getTime() + IST_MS).toISOString().slice(0, 10);
const istHour = (date) => {
    const d = new Date(date.getTime() + IST_MS);
    return d.getUTCHours() + d.getUTCMinutes() / 60;
};
function addDays(day, n) {
    const [y, m, d] = day.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function istMidnight(day) {
    const [y, m, d] = day.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d) - IST_MS);
}
const refTime = (day, at) => new Date(istMidnight(day).getTime() + AT_HOURS[at || 'sunrise'] * 3600000);
const weekdayOf = (day) => new Date(day + 'T00:00:00Z').getUTCDay(); // 0=Sun

// ── astronomy helpers ───────────────────────────────────────────────────────
const sunSid = (date) => norm(Astronomy.SunPosition(date).elon - ayanamsa(date));
const moonSid = (date) => norm(Astronomy.EclipticGeoMoon(date).lon - ayanamsa(date));

// ── per-year context (lunations + sankrantis), cached ───────────────────────
const ctxCache = new Map();

function buildContext(year) {
    if (ctxCache.has(year)) return ctxCache.get(year);

    // New moons from Nov of the previous year to Mar of the next year, so
    // months that straddle New Year (Pausha, Magha) are complete.
    const newMoons = [];
    let t = Astronomy.SearchMoonPhase(0, new Date(Date.UTC(year - 1, 10, 1)), 40);
    const stop = Date.UTC(year + 1, 2, 15);
    while (t && t.date.getTime() < stop) {
        newMoons.push(t.date);
        t = Astronomy.SearchMoonPhase(0, new Date(t.date.getTime() + 20 * DAY), 40);
    }

    const lunations = [];
    for (let i = 0; i < newMoons.length - 1; i++) {
        const start = newMoons[i];
        const end = newMoons[i + 1];
        const signStart = Math.floor(sunSid(start) / 30);
        const signEnd = Math.floor(sunSid(end) / 30);
        lunations.push({
            start, end,
            masa: MASA[(signStart + 1) % 12],   // Sun in Meena at new moon => Chaitra
            adhika: signStart === signEnd,       // no sankranti inside => adhika (leap) month
        });
    }

    // Sankranti (Sun ingress into each sidereal sign) — need the whole span
    // Dec(prev) … Jan(next) so solar-month windows are complete.
    const sankrantis = []; // { sign, time, day (month's first civil day) }
    let cursor = new Date(Date.UTC(year - 1, 11, 1));
    const cursorStop = Date.UTC(year + 1, 1, 15);
    while (cursor.getTime() < cursorStop) {
        const s = sunSid(cursor);
        const nextSign = (Math.floor(s / 30) + 1) % 12;
        // Search on the tropical scale: target = sidereal target + ayanamsa (refined once).
        let approx = new Date(cursor.getTime() + ((nextSign * 30 - s + 360) % 360) / 0.9856 * DAY);
        let target = norm(nextSign * 30 + ayanamsa(approx));
        let ev = Astronomy.SearchSunLongitude(target, new Date(cursor.getTime()), 45);
        if (!ev) break;
        target = norm(nextSign * 30 + ayanamsa(ev.date));
        ev = Astronomy.SearchSunLongitude(target, new Date(cursor.getTime()), 45);
        if (!ev) break;
        // Month starts the same civil day if the ingress is before sunset, else next day.
        const day = istHour(ev.date) < 17.5 ? istDay(ev.date) : addDays(istDay(ev.date), 1);
        sankrantis.push({ sign: nextSign, time: ev.date, day });
        cursor = new Date(ev.date.getTime() + 2 * DAY);
    }

    const ctx = { year, lunations, sankrantis };
    ctxCache.set(year, ctx);
    return ctx;
}

// Window [startDay, endDay) of the solar month for `sign` that overlaps `year`.
function solarMonthWindows(ctx, sign) {
    const out = [];
    for (let i = 0; i < ctx.sankrantis.length - 1; i++) {
        if (ctx.sankrantis[i].sign === sign) {
            out.push({ start: ctx.sankrantis[i].day, end: ctx.sankrantis[i + 1].day });
        }
    }
    return out;
}

// ── tithi → civil day ───────────────────────────────────────────────────────
// k: 1..15 Shukla (15 = Purnima), 16..30 Krishna (30 = Amavasya)
function tithiWindow(lun, k) {
    const from = new Date(lun.start.getTime() - 2 * 3600000);
    const s = k === 1 ? lun.start : Astronomy.SearchMoonPhase((k - 1) * 12, from, 32)?.date;
    const e = k === 30 ? lun.end : Astronomy.SearchMoonPhase((k % 30) * 12, from, 32)?.date;
    return s && e ? { s, e } : null;
}

function dayForTithi(lun, k, at) {
    const w = tithiWindow(lun, k);
    if (!w) return null;
    const first = istDay(w.s);
    const last = istDay(w.e);
    for (let d = first; d <= last; d = addDays(d, 1)) {
        const r = refTime(d, at);
        if (r >= w.s && r < w.e) return d;
    }
    // Tithi never spans the reference moment (a "kshaya" tithi): use the day it begins.
    return first;
}

// ── rule evaluators → array of 'YYYY-MM-DD' (any year; caller filters) ─────
function evalRule(rule, ctx) {
    switch (rule.t) {
        case 'L':
            return ctx.lunations
                .filter(l => l.masa === rule.masa && !l.adhika)
                .map(l => dayForTithi(l, rule.k, rule.at))
                .filter(Boolean);

        case 'LS': {
            const wins = solarMonthWindows(ctx, rule.sign);
            const days = ctx.lunations
                .filter(l => !l.adhika)
                .map(l => dayForTithi(l, rule.k, rule.at))
                .filter(Boolean);
            return days.filter(d => wins.some(w => d >= w.start && d < w.end));
        }

        case 'S':
            return ctx.sankrantis.filter(s => s.sign === rule.sign).map(s => addDays(s.day, rule.off || 0));

        case 'N': {
            const out = [];
            for (const w of solarMonthWindows(ctx, rule.sign)) {
                for (let d = w.start; d < w.end; d = addDays(d, 1)) {
                    const nak = Math.floor(moonSid(refTime(d, rule.at)) / (360 / 27));
                    if (nak === rule.nak) { out.push(addDays(d, rule.off || 0)); break; }
                }
            }
            return out;
        }

        case 'W': {
            return evalRule(rule.base, ctx).map(base => {
                let d = base;
                if (rule.dir === 'before') {            // strictly before
                    d = addDays(d, -1);
                    while (weekdayOf(d) !== rule.weekday) d = addDays(d, -1);
                } else if (rule.dir === 'onafter') {    // on or after
                    while (weekdayOf(d) !== rule.weekday) d = addDays(d, 1);
                } else {                                // strictly after
                    d = addDays(d, 1);
                    while (weekdayOf(d) !== rule.weekday) d = addDays(d, 1);
                }
                return d;
            });
        }

        case 'D':
            return evalRule(rule.base, ctx).map(d => addDays(d, rule.off));

        case 'FX':
            return [`${ctx.year}-${String(rule.m).padStart(2, '0')}-${String(rule.d).padStart(2, '0')}`];

        default:
            return [];
    }
}

// Public: all festival dates of `defs` that fall in `year`, sorted.
// defs: [{ key, name, desc, rule }]
function computeYear(defs, year) {
    const ctx = buildContext(year);
    const out = [];
    for (const def of defs) {
        let days;
        try { days = evalRule(def.rule, ctx); } catch (e) { days = []; }
        const seen = new Set();
        for (const d of days) {
            if (!d.startsWith(String(year)) || seen.has(d)) continue;
            seen.add(d);
            out.push({ key: def.key, name: def.name, description: def.desc || '', date: d });
        }
    }
    out.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
    return out;
}

module.exports = { computeYear, buildContext, evalRule, MASA };
