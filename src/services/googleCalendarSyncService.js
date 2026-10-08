// "Sync to Google Calendar": lets a DivineConnect user connect their own
// Google account (OAuth 2.0, read-only) and import their calendar events into
// the DivineConnect calendar.
//
// Read-only scope (calendar.readonly) — DivineConnect never writes to Google.
// Refresh tokens are stored AES-256-GCM encrypted.
//
// Required env:
//   GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
//   GOOGLE_OAUTH_REDIRECT_URI   e.g. http://localhost:5001/api/calendar/google/callback
//   CLIENT_URL                  where to send the browser after consent
// Optional: GOOGLE_TOKEN_ENC_KEY (defaults to a key derived from JWT_SECRET)
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { getJwtSecret } = require('../config/jwt');
const { ensureTables, DEFAULT_TZ } = require('./calendarEventsService');
const { addDays, isValidTimeZone } = require('../utils/eventRecurrence');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly', 'openid', 'email'];
const SYNC_PAST_MONTHS = 6;
const SYNC_FUTURE_MONTHS = 12;
const MAX_EVENTS_PER_CALENDAR = 2500;

class GoogleSyncError extends Error {
    constructor(message, { status = 502, reconnect = false } = {}) {
        super(message); this.status = status; this.reconnect = reconnect;
    }
}

const cfg = () => ({
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
});
const isConfigured = () => { const c = cfg(); return !!(c.clientId && c.clientSecret && c.redirectUri); };
const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

// ─── token encryption ───────────────────────────────────────────────────────
const encKey = () => crypto.createHash('sha256').update(process.env.GOOGLE_TOKEN_ENC_KEY || getJwtSecret()).digest();
function encrypt(plain) {
    const iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv('aes-256-gcm', encKey(), iv);
    const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
    return [iv, c.getAuthTag(), enc].map(b => b.toString('base64')).join('.');
}
function decrypt(blob) {
    const [iv, tag, enc] = blob.split('.').map(x => Buffer.from(x, 'base64'));
    const d = crypto.createDecipheriv('aes-256-gcm', encKey(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}

// ─── OAuth ──────────────────────────────────────────────────────────────────
function buildAuthUrl(userId) {
    if (!isConfigured()) throw new GoogleSyncError('Google sync is not configured on the server.', { status: 503 });
    const { clientId, redirectUri } = cfg();
    const state = jwt.sign({ uid: userId, purpose: 'gcal-connect' }, getJwtSecret(), { expiresIn: '10m' });
    const params = new URLSearchParams({
        client_id: clientId, redirect_uri: redirectUri, response_type: 'code',
        scope: SCOPES.join(' '), access_type: 'offline', prompt: 'consent',
        include_granted_scopes: 'true', state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function tokenRequest(params) {
    const { clientId, clientSecret } = cfg();
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...params }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const reconnect = json.error === 'invalid_grant';
        throw new GoogleSyncError(
            reconnect ? 'Google access was revoked or expired. Please reconnect.' : `Google token error: ${json.error_description || json.error || res.status}`,
            { status: reconnect ? 401 : 502, reconnect });
    }
    return json;
}

// Called from the OAuth redirect. Returns the DivineConnect user id.
async function handleCallback(code, state) {
    let payload;
    try { payload = jwt.verify(state, getJwtSecret()); } catch { throw new GoogleSyncError('Invalid or expired sign-in state.', { status: 400 }); }
    if (payload.purpose !== 'gcal-connect') throw new GoogleSyncError('Invalid sign-in state.', { status: 400 });

    await ensureTables();
    const { redirectUri } = cfg();
    const tok = await tokenRequest({ code, grant_type: 'authorization_code', redirect_uri: redirectUri });

    let email = null;
    try { email = JSON.parse(Buffer.from(tok.id_token.split('.')[1], 'base64url').toString()).email || null; } catch { /* optional */ }

    let refresh = tok.refresh_token;
    if (!refresh) {
        const prev = await pool.query(`SELECT refresh_token FROM user_google_calendar_connections WHERE user_id = $1`, [payload.uid]);
        if (!prev.rows.length) throw new GoogleSyncError('Google did not return offline access. Please try connecting again.', { status: 400 });
        refresh = decrypt(prev.rows[0].refresh_token);
    }
    await pool.query(
        `INSERT INTO user_google_calendar_connections (user_id, google_email, refresh_token, access_token, access_expires)
         VALUES ($1,$2,$3,$4, NOW() + ($5 || ' seconds')::interval)
         ON CONFLICT (user_id) DO UPDATE SET google_email = EXCLUDED.google_email, refresh_token = EXCLUDED.refresh_token,
           access_token = EXCLUDED.access_token, access_expires = EXCLUDED.access_expires`,
        [payload.uid, email, encrypt(refresh), encrypt(tok.access_token), String(tok.expires_in || 3600)]);
    return payload.uid;
}

async function getConnection(userId) {
    await ensureTables();
    const { rows } = await pool.query(`SELECT * FROM user_google_calendar_connections WHERE user_id = $1`, [userId]);
    return rows[0] || null;
}

async function getStatus(userId) {
    const conn = await getConnection(userId);
    return {
        configured: isConfigured(),
        connected: !!conn,
        email: conn?.google_email || null,
        last_synced_at: conn?.last_synced_at || null,
        last_sync_count: conn?.last_sync_count ?? null,
    };
}

async function getAccessToken(conn) {
    if (conn.access_token && conn.access_expires && new Date(conn.access_expires).getTime() > Date.now() + 60000) {
        return decrypt(conn.access_token);
    }
    const tok = await tokenRequest({ grant_type: 'refresh_token', refresh_token: decrypt(conn.refresh_token) });
    await pool.query(
        `UPDATE user_google_calendar_connections SET access_token = $2, access_expires = NOW() + ($3 || ' seconds')::interval WHERE user_id = $1`,
        [conn.user_id, encrypt(tok.access_token), String(tok.expires_in || 3600)]);
    return tok.access_token;
}

async function gget(token, path, params = {}) {
    const res = await fetch(`https://www.googleapis.com/calendar/v3${path}?${new URLSearchParams(params)}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 401) throw new GoogleSyncError('Google access expired. Please reconnect.', { status: 401, reconnect: true });
    if (res.status === 403) {
        const reason = json.error?.errors?.[0]?.reason || '';
        if (/insufficient|scope/i.test(reason + json.error?.message)) {
            throw new GoogleSyncError('Calendar permission was not granted. Please reconnect and allow calendar access.', { status: 403, reconnect: true });
        }
        if (/accessNotConfigured|has not been used/i.test(reason + json.error?.message)) {
            throw new GoogleSyncError('The Google Calendar API is not enabled for this project in Google Cloud Console.', { status: 502 });
        }
    }
    if (!res.ok) throw new GoogleSyncError(`Google Calendar error: ${json.error?.message || res.status}`);
    return json;
}

// ─── mapping Google events -> user_calendar_events rows ──────────────────────────
function localParts(iso, tz) {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
        timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).formatToParts(new Date(iso)).map(x => [x.type, x.value]));
    return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
const stripHtml = (s) => String(s || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

function mapGoogleEvent(item, calTz) {
    if (!item.start || (!item.start.date && !item.start.dateTime)) return null;
    const row = {
        google_event_id: item.id,
        title: String(item.summary || '(No title)').slice(0, 200),
        description: stripHtml(item.description).slice(0, 5000) || null,
        location: String(item.location || item.hangoutLink || '').slice(0, 500) || null,
        google_link: item.htmlLink || null,
        recurrence: 'none', reminder_minutes: null,
    };
    const hasGuests = (item.attendees || []).length > 1 || item.hangoutLink || item.conferenceData;
    row.event_type = item.eventType === 'birthday' ? 'birthday' : hasGuests ? 'meeting' : 'event';

    if (item.start.date) { // all-day; Google's end.date is exclusive
        row.all_day = true; row.timezone = calTz;
        row.start_date = item.start.date; row.start_time = null; row.end_time = null;
        const lastDay = item.end?.date ? addDays(item.end.date, -1) : item.start.date;
        row.end_date = lastDay > item.start.date ? lastDay : null;
    } else {
        const tzRaw = item.start.timeZone || calTz;
        const tz = isValidTimeZone(tzRaw) ? tzRaw : DEFAULT_TZ;
        const s = localParts(item.start.dateTime, tz);
        row.all_day = false; row.timezone = tz;
        row.start_date = s.date; row.start_time = s.time;
        if (item.end?.dateTime) {
            const e = localParts(item.end.dateTime, tz);
            row.end_date = e.date !== s.date ? e.date : null;
            row.end_time = e.time;
        } else { row.end_date = null; row.end_time = null; }
    }
    if (row.event_type === 'birthday') { row.all_day = true; row.start_time = null; row.end_time = null; }
    return row;
}

async function upsertChunk(userId, calId, rows) {
    const col = (k) => rows.map(r => r[k]);
    await pool.query(
        `INSERT INTO user_calendar_events
           (user_id, source, google_calendar_id, google_event_id, google_link, title, event_type, description, location,
            start_date, end_date, start_time, end_time, all_day, timezone, recurrence, reminder_minutes)
         SELECT $1, 'google', $2, t.gid, t.link, t.title, t.etype, t.descr, t.loc,
                t.sd::date, t.ed::date, t.st::time, t.et::time, t.allday, t.tz, 'none', NULL
         FROM unnest($3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[], $9::text[],
                     $10::text[], $11::text[], $12::text[], $13::boolean[], $14::text[])
              AS t(gid, link, title, etype, descr, loc, sd, ed, st, et, allday, tz)
         ON CONFLICT (user_id, google_calendar_id, google_event_id) WHERE google_event_id IS NOT NULL
         DO UPDATE SET google_link = EXCLUDED.google_link, title = EXCLUDED.title, event_type = EXCLUDED.event_type,
           description = EXCLUDED.description, location = EXCLUDED.location, start_date = EXCLUDED.start_date,
           end_date = EXCLUDED.end_date, start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time,
           all_day = EXCLUDED.all_day, timezone = EXCLUDED.timezone, updated_at = NOW()`,
        [userId, calId, col('google_event_id'), col('google_link'), col('title'), col('event_type'), col('description'),
            col('location'), col('start_date'), col('end_date'), col('start_time'), col('end_time'), col('all_day'), col('timezone')]);
}

// ─── sync ───────────────────────────────────────────────────────────────────
async function syncUser(userId) {
    const conn = await getConnection(userId);
    if (!conn) throw new GoogleSyncError('Google Calendar is not connected.', { status: 400 });
    let token;
    try { token = await getAccessToken(conn); } catch (e) {
        if (e.reconnect) await pool.query(`DELETE FROM user_google_calendar_connections WHERE user_id = $1`, [userId]);
        throw e;
    }

    const now = new Date();
    const timeMin = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - SYNC_PAST_MONTHS, 1));
    const timeMax = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + SYNC_FUTURE_MONTHS + 1, 1));
    const minDay = timeMin.toISOString().slice(0, 10), maxDay = timeMax.toISOString().slice(0, 10);

    // All calendars the user can see — but skip Google's public holiday calendars:
    // DivineConnect already shows festivals & holidays itself.
    const calendars = [];
    let pageToken;
    do {
        const page = await gget(token, '/users/me/calendarList', { minAccessRole: 'reader', maxResults: '250', ...(pageToken && { pageToken }) });
        calendars.push(...(page.items || []));
        pageToken = page.nextPageToken;
    } while (pageToken);
    const wanted = calendars.filter(c => c.selected !== false && !/#holiday@group\.v\.calendar\.google\.com$/.test(c.id));

    let imported = 0;
    const names = [];
    for (const cal of wanted) {
        const seen = [];
        const rows = [];
        let tok;
        do {
            const page = await gget(token, `/calendars/${encodeURIComponent(cal.id)}/events`, {
                singleEvents: 'true', orderBy: 'startTime', maxResults: '250',
                timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString(),
                ...(tok && { pageToken: tok }),
            });
            for (const item of page.items || []) {
                if (item.status === 'cancelled') continue;
                const row = mapGoogleEvent(item, cal.timeZone && isValidTimeZone(cal.timeZone) ? cal.timeZone : DEFAULT_TZ);
                if (row) { rows.push(row); seen.push(row.google_event_id); }
            }
            tok = page.nextPageToken;
        } while (tok && rows.length < MAX_EVENTS_PER_CALENDAR);

        for (let i = 0; i < rows.length; i += 500) await upsertChunk(userId, cal.id, rows.slice(i, i + 500));

        // events deleted/moved out of Google since the last sync
        await pool.query(
            `DELETE FROM user_calendar_events
             WHERE user_id = $1 AND source = 'google' AND google_calendar_id = $2
               AND start_date >= $3 AND start_date < $4 AND NOT (google_event_id = ANY($5::text[]))`,
            [userId, cal.id, minDay, maxDay, seen]);

        imported += rows.length;
        names.push(cal.summaryOverride || cal.summary || cal.id);
    }

    // calendars the user unselected / left since the last sync
    await pool.query(
        `DELETE FROM user_calendar_events WHERE user_id = $1 AND source = 'google' AND NOT (google_calendar_id = ANY($2::text[]))`,
        [userId, wanted.map(c => c.id)]);

    await pool.query(
        `UPDATE user_google_calendar_connections SET last_synced_at = NOW(), last_sync_count = $2 WHERE user_id = $1`, [userId, imported]);
    return { imported, calendars: names, synced_at: new Date().toISOString() };
}

async function disconnect(userId) {
    const conn = await getConnection(userId);
    if (conn) {
        try { // best-effort revoke so the app disappears from the user's Google account permissions
            await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(decrypt(conn.refresh_token))}`, { method: 'POST' });
        } catch { /* ignore */ }
    }
    await pool.query(`DELETE FROM user_google_calendar_connections WHERE user_id = $1`, [userId]);
    const del = await pool.query(`DELETE FROM user_calendar_events WHERE user_id = $1 AND source = 'google'`, [userId]);
    return { removed_events: del.rowCount };
}

module.exports = {
    GoogleSyncError, isConfigured, clientUrl, buildAuthUrl, handleCallback, getStatus, syncUser, disconnect,
    mapGoogleEvent, encrypt, decrypt,
};
