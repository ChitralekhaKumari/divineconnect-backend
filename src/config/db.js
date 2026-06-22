// divineConnect/divineconnect_backend/src/config/db.js
// REPLACE your existing file with this version

const { Pool, types } = require('pg');
require('dotenv').config();

// ─── Critical fix ──────────────────────────────────────────────────────────
// By default, node-postgres converts PostgreSQL DATE columns into JS Date
// objects. When those get serialized in res.json(), they turn into UTC
// ISO timestamps (e.g. "2026-06-26T00:00:00.000Z"). Depending on the
// server/browser timezone, this can shift the date backward or forward
// by one day, and breaks any string-based date comparison like
// f.date.startsWith("2026-06-16").
//
// PostgreSQL's DATE type OID is 1082. Overriding its parser to return
// the raw string (e.g. "2026-06-26") avoids all timezone conversion.
types.setTypeParser(1082, (val) => val);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'divineconnect',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test the connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ PostgreSQL connected successfully');
    release();
  }
});

module.exports = pool;