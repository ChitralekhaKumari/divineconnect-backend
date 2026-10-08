// Date helpers for user calendar events: recurrence expansion and
// "local wall-clock time in an IANA timezone -> UTC instant" conversion.
// Pure functions (no DB, no I/O) so they are easy to unit test.
//
// Dates are plain 'YYYY-MM-DD' strings throughout to avoid the classic
// JS Date timezone shifts; all arithmetic happens in UTC on those strings.

const RECURRENCES = ['none', 'daily', 'weekly', 'monthly', 'yearly'];

const pad = (n) => String(n).padStart(2, '0');

function parseDay(day) {
    const [y, m, d] = String(day).slice(0, 10).split('-').map(Number);
    return { y, m, d };
}
function toDay(y, m, d) { return `${y}-${pad(m)}-${pad(d)}`; }
function daysInMonth(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }

function addDays(day, n) {
    const { y, m, d } = parseDay(day);
    return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function diffDays(a, b) {
    const pa = parseDay(a), pb = parseDay(b);
    return Math.round((Date.UTC(pa.y, pa.m - 1, pa.d) - Date.UTC(pb.y, pb.m - 1, pb.d)) / 86400000);
}

// All occurrence dates of an event inside [from, to] (inclusive, YYYY-MM-DD).
// `start` is the first occurrence. Monthly/yearly events on a day that doesn't
// exist in the target month (31st, Feb 29) fall on that month's last day.
function occurrencesBetween(start, recurrence, from, to) {
    start = String(start).slice(0, 10);
    if (to < start) return [];
    const out = [];

    if (!recurrence || recurrence === 'none') {
        if (start >= from && start <= to) out.push(start);
        return out;
    }

    if (recurrence === 'daily' || recurrence === 'weekly') {
        const step = recurrence === 'daily' ? 1 : 7;
        let first = start;
        if (from > start) {
            const skip = Math.ceil(diffDays(from, start) / step);
            first = addDays(start, skip * step);
        }
        for (let d = first; d <= to; d = addDays(d, step)) out.push(d);
        return out;
    }

    const s = parseDay(start);
    const f = parseDay(from);
    const t = parseDay(to);

    if (recurrence === 'monthly') {
        // begin at whichever is later: the event's first month or the window's first month
        let [y, m] = (f.y * 12 + f.m > s.y * 12 + s.m) ? [f.y, f.m] : [s.y, s.m];
        while (y < t.y || (y === t.y && m <= t.m)) {
            const day = toDay(y, m, Math.min(s.d, daysInMonth(y, m)));
            if (day >= start && day >= from && day <= to) out.push(day);
            m++; if (m > 12) { m = 1; y++; }
        }
        return out;
    }

    if (recurrence === 'yearly') {
        for (let y = Math.max(f.y, s.y); y <= t.y; y++) {
            const day = toDay(y, s.m, Math.min(s.d, daysInMonth(y, s.m)));
            if (day >= start && day >= from && day <= to) out.push(day);
        }
        return out;
    }

    return out;
}

// Offset (ms) of `tz` from UTC at the given UTC instant.
function tzOffsetMs(utcMs, tz) {
    const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const p = Object.fromEntries(dtf.formatToParts(new Date(utcMs)).map(x => [x.type, x.value]));
    const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return asUtc - Math.floor(utcMs / 1000) * 1000;
}

// Wall-clock `day` + `time` ('HH:MM' or 'HH:MM:SS') in `tz` -> Date (UTC instant).
function zonedToUtc(day, time, tz = 'Asia/Kolkata') {
    const { y, m, d } = parseDay(day);
    const [hh, mm] = String(time || '00:00').split(':').map(Number);
    const guess = Date.UTC(y, m - 1, d, hh || 0, mm || 0, 0);
    let ms = guess - tzOffsetMs(guess, tz);
    ms = guess - tzOffsetMs(ms, tz); // second pass handles DST edges
    return new Date(ms);
}

function isValidTimeZone(tz) {
    try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; }
}

// Instant at which the reminder for one occurrence should be sent.
// All-day events (birthdays, anniversaries) are reminded at 09:00 local time.
const ALL_DAY_REMINDER_TIME = '09:00';
function reminderInstant(occurrenceDay, startTime, allDay, minutesBefore, tz) {
    const at = allDay || !startTime ? ALL_DAY_REMINDER_TIME : startTime;
    return new Date(zonedToUtc(occurrenceDay, at, tz).getTime() - minutesBefore * 60000);
}

module.exports = {
    RECURRENCES, addDays, diffDays, parseDay, occurrencesBetween,
    zonedToUtc, isValidTimeZone, reminderInstant, ALL_DAY_REMINDER_TIME,
};
