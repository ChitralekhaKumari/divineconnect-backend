// src/utils/panchangEngine.js
//
// Full Vedic Panchang engine — computes real astronomical positions using
// "astronomy-engine" (pure JavaScript, NASA JPL-grade precision, MIT license,
// NO native compilation — safe for Vercel serverless).
//
// Sidereal (Lahiri ayanamsa) positions of Sun & Moon drive every core element:
// Tithi, Nakshatra, Yoga, Karana, Paksha, Maas, Samvatsara, Sankranti.
// Sunrise/sunset/moonrise/moonset are real rise/set searches for the given
// lat/lon — not approximations.
//
// Rahu Kaal / Yamaganda / Gulika Kaal / Abhijit / Brahma Muhurta / Hora /
// Choghadiya use the standard weekday + day-segment formulas that every
// traditional Panchang (DrikPanchang, ProKerala, etc.) also uses.
//
// npm install astronomy-engine   (pure JS — no build step, no data files)

const Astronomy = require('astronomy-engine');

// ── Reference tables ────────────────────────────────────────────────────────
const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
  'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta',
  'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
];

const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami',
  'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi',
];

const YOGAS = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarman',
  'Dhriti', 'Shoola', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
  'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha',
  'Shukla', 'Brahma', 'Indra', 'Vaidhriti',
];

const KARANA_MOVABLE = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja', 'Vanija', 'Vishti'];
const KARANA_FIXED = ['Kimstughna', 'Shakuni', 'Chatushpada', 'Naga'];

// Amanta lunar month names, indexed by the solar sidereal zodiac sign (0=Aries)
const MASA_NAMES = [
  'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada',
  'Ashwin', 'Kartik', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna',
];

const SANKRANTI_NAMES = [
  'Mesha Sankranti', 'Vrishabha Sankranti', 'Mithuna Sankranti', 'Karka Sankranti',
  'Simha Sankranti', 'Kanya Sankranti', 'Tula Sankranti', 'Vrishchika Sankranti',
  'Dhanu Sankranti', 'Makar Sankranti', 'Kumbha Sankranti', 'Meena Sankranti',
];

const RASHI_NAMES = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];

// 60-year Jovian (Brihaspati) cycle names, in order, cycle starts at "Prabhava"
const SAMVATSARA_NAMES = [
  'Prabhava', 'Vibhava', 'Shukla', 'Pramoda', 'Prajapati', 'Angirasa', 'Shrimukha',
  'Bhava', 'Yuva', 'Dhata', 'Ishvara', 'Bahudhanya', 'Pramathi', 'Vikrama', 'Vrisha',
  'Chitrabhanu', 'Svabhanu', 'Tarana', 'Parthiva', 'Vyaya', 'Sarvajit', 'Sarvadhari',
  'Virodhi', 'Vikriti', 'Khara', 'Nandana', 'Vijaya', 'Jaya', 'Manmatha', 'Durmukhi',
  'Hemalamba', 'Vilambi', 'Vikari', 'Sharvari', 'Plava', 'Shubhakrit', 'Shobhakrit',
  'Krodhi', 'Vishvavasu', 'Parabhava', 'Plavanga', 'Kilaka', 'Saumya', 'Sadharana',
  'Virodhikrit', 'Paridhavi', 'Pramadi', 'Ananda', 'Rakshasa', 'Nala', 'Pingala',
  'Kalayukti', 'Siddharthi', 'Raudra', 'Durmati', 'Dundubhi', 'Rudhirodgari', 'Raktakshi',
  'Krodhana', 'Kshaya',
];
// Vikram Samvat year for a given Gregorian year (approx, Chaitra Shukla Pratipada start)
// Samvatsara index cycles independently; anchor: Vikram Samvat 1987 (1930-31 CE) = "Vibhava"? --
// We anchor using a well-known modern reference instead (safer): 2023-24 CE = "Shobhakrit" per
// most Panchang publications (Vikram Samvat 2080). Index of 'Shobhakrit' in table = 36.
const SAMVATSARA_ANCHOR_YEAR = 2023; // CE year in which this samvatsara begins (~April)
const SAMVATSARA_ANCHOR_INDEX = SAMVATSARA_NAMES.indexOf('Shobhakrit');

// Weekday segment index (0=Sun..6=Sat) for Rahu Kaal, Yamaganda, Gulika Kaal
// (day divided sunrise→sunset into 8 equal parts, this is segment number 0-7)
const RAHU_SEGMENT_BY_DAY = [7, 1, 6, 4, 5, 3, 2];
const YAMAGANDA_SEGMENT_BY_DAY = [4, 3, 2, 1, 0, 6, 5];
const GULIKA_SEGMENT_BY_DAY = [6, 5, 4, 3, 2, 1, 0];

// Chaldean planetary order used for Hora & Choghadiya sequencing
const CHALDEAN_ORDER = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'];
// Which planet starts the Hora sequence on each weekday (0=Sun..6=Sat)
const HORA_START_BY_DAY = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

// Choghadiya quality by ruling planet
const CHOGHADIYA_QUALITY = {
  Sun: 'Udveg', Moon: 'Amrit', Mars: 'Rog', Mercury: 'Labh',
  Jupiter: 'Shubh', Venus: 'Char', Saturn: 'Kaal',
};
const CHOGHADIYA_GOOD = new Set(['Amrit', 'Shubh', 'Labh', 'Char']);

// ── Time helpers ─────────────────────────────────────────────────────────────
function fmt(date) {
  if (!date || isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
  });
}
function range(start, end) {
  return { start, end, label: `${fmt(start)} - ${fmt(end)}` };
}

// ── Ayanamsa (Lahiri / Chitrapaksha approximation) ──────────────────────────
// Standard practical formula: 23.85709 deg at J2000.0 (the official Lahiri/
// Indian Astronomical Ephemeris value, matching Swiss Ephemeris SE_SIDM_LAHIRI),
// precessing ~50.29"/year. Cross-checked against surendrajat/panchang's
// published METHODOLOGY.md (MIT astronomy-engine base, independently verified
// against Swiss Ephemeris) — formulas/facts only, no code copied (that repo is
// AGPL-3.0, which would force this backend open-source if its code were reused).
function ayanamsa(date) {
  const t = Astronomy.MakeTime(date);
  const T = t.tt / 36525.0; // Julian centuries since J2000 (t.tt = days since J2000)
  return 23.85709 + 1.396042 * T + 0.000308 * T * T;
}

function siderealLongitude(body, date, observer) {
  const eq = Astronomy.Equator(body, date, observer, true, true);
  const ecl = Astronomy.Ecliptic(eq.vec);
  let lon = ecl.elon - ayanamsa(date);
  return ((lon % 360) + 360) % 360;
}

// ── Core Panchang elements for one moment (typically local noon or sunrise) ─
function computeCoreElements(date, observer) {
  const sunLon = siderealLongitude('Sun', date, observer);
  const moonLon = siderealLongitude('Moon', date, observer);
  const diff = ((moonLon - sunLon) % 360 + 360) % 360;

  // Tithi
  const tithiIndex = Math.floor(diff / 12); // 0-29
  const tithiNumInPaksha = (tithiIndex % 15) + 1; // 1-15
  const paksha = tithiIndex < 15 ? 'Shukla Paksha' : 'Krishna Paksha';
  const isPurnima = tithiIndex === 14;
  const isAmavasya = tithiIndex === 29;
  const tithiName = isPurnima ? 'Purnima' : isAmavasya ? 'Amavasya' : TITHI_NAMES[tithiNumInPaksha - 1];
  const isEkadashi = tithiNumInPaksha === 11;

  // Nakshatra (+ pada, quarter)
  const nakshatraSize = 360 / 27;
  const nakshatraIndex = Math.floor(moonLon / nakshatraSize) % 27;
  const nakshatraName = NAKSHATRAS[nakshatraIndex];
  const pada = Math.floor((moonLon % nakshatraSize) / (nakshatraSize / 4)) + 1;

  // Yoga
  const yogaSum = ((sunLon + moonLon) % 360 + 360) % 360;
  const yogaIndex = Math.floor(yogaSum / (360 / 27)) % 27;
  const yogaName = YOGAS[yogaIndex];

  // Karana (half-tithi; 60 per lunar month, 4 fixed + 7 movable x8 repeating)
  const karanaIndex = Math.floor(diff / 6); // 0-59
  let karanaName;
  if (karanaIndex === 0) karanaName = KARANA_FIXED[0];
  else if (karanaIndex >= 57) karanaName = KARANA_FIXED[karanaIndex - 56];
  else karanaName = KARANA_MOVABLE[(karanaIndex - 1) % 7];

  // Maas (Amanta lunar month) — via Sun's sidereal zodiac sign
  const solarSignIndex = Math.floor(sunLon / 30) % 12;
  const masaName = MASA_NAMES[solarSignIndex];
  const rashiName = RASHI_NAMES[solarSignIndex];
  const moonRashiIndex = Math.floor(moonLon / 30) % 12;
  const moonRashiName = RASHI_NAMES[moonRashiIndex];

  return {
    sunLon, moonLon, solarSignIndex,
    tithi: { name: tithiName, numberInPaksha: tithiNumInPaksha, paksha, isPurnima, isAmavasya, isEkadashi },
    nakshatra: { name: nakshatraName, pada },
    yoga: { name: yogaName },
    karana: { name: karanaName },
    masa: masaName,
    rashi: { sun: rashiName, moon: moonRashiName },
  };
}

// ── Samvatsara (60-year Jovian cycle name) ──────────────────────────────────
function getSamvatsara(date) {
  // New samvatsara begins around Chaitra Shukla Pratipada (~March/April).
  // Approximate by using the year, rolling back one if we're before ~March 22.
  let year = date.getFullYear();
  const isBeforeNewYear = (date.getMonth() < 2) || (date.getMonth() === 2 && date.getDate() < 22);
  if (isBeforeNewYear) year -= 1;
  const offset = year - SAMVATSARA_ANCHOR_YEAR;
  const idx = ((SAMVATSARA_ANCHOR_INDEX + offset) % 60 + 60) % 60;
  return SAMVATSARA_NAMES[idx];
}

// ── Hora (planetary hours): 12 day + 12 night segments ──────────────────────
function getHoraTable(sunrise, sunset, nextSunrise, dayOfWeek) {
  const startPlanet = HORA_START_BY_DAY[dayOfWeek];
  let idx = CHALDEAN_ORDER.indexOf(startPlanet);

  const dayMs = (sunset.getTime() - sunrise.getTime()) / 12;
  const nightMs = (nextSunrise.getTime() - sunset.getTime()) / 12;

  const horas = [];
  for (let i = 0; i < 12; i++) {
    const start = new Date(sunrise.getTime() + dayMs * i);
    const end = new Date(sunrise.getTime() + dayMs * (i + 1));
    horas.push({ planet: CHALDEAN_ORDER[(idx + i) % 7], ...range(start, end), period: 'day' });
  }
  for (let i = 0; i < 12; i++) {
    const start = new Date(sunset.getTime() + nightMs * i);
    const end = new Date(sunset.getTime() + nightMs * (i + 1));
    horas.push({ planet: CHALDEAN_ORDER[(idx + 12 + i) % 7], ...range(start, end), period: 'night' });
  }
  return horas;
}

// ── Choghadiya: 8 day + 8 night segments ────────────────────────────────────
function getChoghadiyaTable(sunrise, sunset, nextSunrise, dayOfWeek) {
  const startPlanet = HORA_START_BY_DAY[dayOfWeek];
  const dayStartIdx = CHALDEAN_ORDER.indexOf(startPlanet);

  const dayMs = (sunset.getTime() - sunrise.getTime()) / 8;
  const nightMs = (nextSunrise.getTime() - sunset.getTime()) / 8;

  const list = [];
  for (let i = 0; i < 8; i++) {
    const planet = CHALDEAN_ORDER[(dayStartIdx + i) % 7];
    const quality = CHOGHADIYA_QUALITY[planet];
    const start = new Date(sunrise.getTime() + dayMs * i);
    const end = new Date(sunrise.getTime() + dayMs * (i + 1));
    list.push({ name: quality, good: CHOGHADIYA_GOOD.has(quality), ...range(start, end), period: 'day' });
  }
  const nightStartIdx = (dayStartIdx + 8) % 7;
  for (let i = 0; i < 8; i++) {
    const planet = CHALDEAN_ORDER[(nightStartIdx + i) % 7];
    const quality = CHOGHADIYA_QUALITY[planet];
    const start = new Date(sunset.getTime() + nightMs * i);
    const end = new Date(sunset.getTime() + nightMs * (i + 1));
    list.push({ name: quality, good: CHOGHADIYA_GOOD.has(quality), ...range(start, end), period: 'night' });
  }
  return list;
}

// ── Main: full Panchang for one calendar day at a location ──────────────────
function getPanchang(dateInput, lat = 28.6139, lon = 77.2090) {
  const date = new Date(dateInput);
  const observer = new Astronomy.Observer(lat, lon, 0);
  const dayOfWeek = date.getUTCDay() === date.getDay() ? date.getDay() : date.getDay(); // local weekday

  const dayStartSearch = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));

  const sunrise = Astronomy.SearchRiseSet('Sun', observer, +1, dayStartSearch, 2)?.date;
  const sunset = sunrise ? Astronomy.SearchRiseSet('Sun', observer, -1, sunrise, 1.2)?.date : null;
  const nextSunrise = sunrise ? Astronomy.SearchRiseSet('Sun', observer, +1, new Date(sunrise.getTime() + 60 * 1000), 2)?.date : null;
  const moonrise = sunrise ? Astronomy.SearchRiseSet('Moon', observer, +1, sunrise, 1.2)?.date : null;
  const moonset = sunrise ? Astronomy.SearchRiseSet('Moon', observer, -1, sunrise, 1.2)?.date : null;

  // Core elements evaluated at local noon (standard Panchang convention uses
  // sunrise for the "ruling" tithi/nakshatra of the day; we report both the
  // day's ruling element (at sunrise) since that's what traditional Panchangs show).
  const atSunrise = computeCoreElements(sunrise || date, observer);

  let rahu_kalam = null, yamaganda = null, gulika_kalam = null, abhijit = null, brahma_muhurta = null;
  let hora = [], choghadiya = [];

  if (sunrise && sunset) {
    const segMs = (sunset.getTime() - sunrise.getTime()) / 8;
    const seg = (i) => range(new Date(sunrise.getTime() + segMs * i), new Date(sunrise.getTime() + segMs * (i + 1)));

    rahu_kalam = seg(RAHU_SEGMENT_BY_DAY[dayOfWeek]);
    yamaganda = seg(YAMAGANDA_SEGMENT_BY_DAY[dayOfWeek]);
    gulika_kalam = seg(GULIKA_SEGMENT_BY_DAY[dayOfWeek]);

    // Abhijit Muhurta: 8th muhurta of the day (middle ~48min around solar noon).
    // Traditionally skipped/considered inapplicable on Wednesdays (Smarta convention).
    const dayLenMs = sunset.getTime() - sunrise.getTime();
    if (dayOfWeek !== 3) {
      const midMs = sunrise.getTime() + dayLenMs / 2;
      abhijit = range(new Date(midMs - dayLenMs / 30), new Date(midMs + dayLenMs / 30));
    }

    // Brahma Muhurta: 1h36m before sunrise, lasting 48 minutes
    brahma_muhurta = range(new Date(sunrise.getTime() - 96 * 60 * 1000), new Date(sunrise.getTime() - 48 * 60 * 1000));

    if (nextSunrise) {
      hora = getHoraTable(sunrise, sunset, nextSunrise, dayOfWeek);
      choghadiya = getChoghadiyaTable(sunrise, sunset, nextSunrise, dayOfWeek);
    }
  }

  return {
    date: date.toISOString().slice(0, 10),
    weekday: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],

    tithi: atSunrise.tithi.name,
    paksha: atSunrise.tithi.paksha,
    nakshatra: atSunrise.nakshatra.name,
    nakshatra_pada: atSunrise.nakshatra.pada,
    yoga: atSunrise.yoga.name,
    karana: atSunrise.karana.name,
    maas: atSunrise.masa,
    samvatsara: getSamvatsara(date),
    sun_rashi: atSunrise.rashi.sun,
    moon_rashi: atSunrise.rashi.moon,

    is_ekadashi: atSunrise.tithi.isEkadashi,
    is_amavasya: atSunrise.tithi.isAmavasya,
    is_purnima: atSunrise.tithi.isPurnima,

    sunrise: fmt(sunrise),
    sunset: fmt(sunset),
    moonrise: fmt(moonrise) || '—',
    moonset: fmt(moonset) || '—',

    rahu_kalam: rahu_kalam?.label || '—',
    yamaganda: yamaganda?.label || '—',
    gulika_kalam: gulika_kalam?.label || '—',
    abhijit_muhurta: abhijit?.label || '—',
    brahma_muhurta: brahma_muhurta?.label || '—',

    hora: hora.map(h => ({ planet: h.planet, time: h.label, period: h.period })),
    choghadiya: choghadiya.map(c => ({ name: c.name, good: c.good, time: c.label, period: c.period })),
  };
}

// ── Month scan: flags Ekadashi / Amavasya / Purnima / Sankranti dates ───────
// Used to put dots/markers on the calendar grid without recomputing the full
// Panchang (hora/choghadiya/muhurtas) for every single day.
function getMonthTithiEvents(year, month, lat = 28.6139, lon = 77.2090) {
  const observer = new Astronomy.Observer(lat, lon, 0);
  const daysInMonth = new Date(year, month, 0).getDate();
  const events = [];
  let prevSignIndex = null;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // Traditional convention: the tithi/sign PREVAILING AT SUNRISE governs the
    // whole civil day — same rule the single-day getPanchang() function uses.
    // Using a fixed noon snapshot instead (as an earlier version of this did)
    // drifts the assigned date by up to a day near a tithi/sankranti boundary.
    const dayStartSearch = new Date(Date.UTC(year, month - 1, d, 0, 0, 0));
    const sunriseRes = Astronomy.SearchRiseSet('Sun', observer, +1, dayStartSearch, 2);
    const momentForDay = sunriseRes ? sunriseRes.date : new Date(Date.UTC(year, month - 1, d, 6, 30, 0));

    const core = computeCoreElements(momentForDay, observer);

    if (core.tithi.isEkadashi) events.push({ date: dateStr, type: 'ekadashi', name: 'Ekadashi' });
    if (core.tithi.isAmavasya) events.push({ date: dateStr, type: 'amavasya', name: 'Amavasya' });
    if (core.tithi.isPurnima) events.push({ date: dateStr, type: 'purnima', name: 'Purnima' });

    if (prevSignIndex !== null && core.solarSignIndex !== prevSignIndex) {
      events.push({ date: dateStr, type: 'sankranti', name: SANKRANTI_NAMES[core.solarSignIndex] });
    }
    prevSignIndex = core.solarSignIndex;
  }
  return events;
}

module.exports = { getPanchang, getMonthTithiEvents, ayanamsa };
