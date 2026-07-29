// Run once: node src/scripts/createBhajansTable.js
require('dotenv').config();
const pool = require('../config/db');

const SQL = `
CREATE TABLE IF NOT EXISTS bhajans (
  id                      SERIAL PRIMARY KEY,
  title                   VARCHAR(255) NOT NULL,
  deity                   VARCHAR(50)  NOT NULL,
  singer                  VARCHAR(150),
  duration_seconds        INTEGER NOT NULL DEFAULT 0,
  language                VARCHAR(50),
  audio_url               TEXT NOT NULL,
  cover_image             TEXT,
  lyrics_original         TEXT,
  lyrics_transliteration  TEXT,
  lyrics_meaning          TEXT,
  play_count              INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bhajans_deity ON bhajans(deity);
CREATE INDEX IF NOT EXISTS idx_bhajans_play_count ON bhajans(play_count DESC);
`;

async function run() {
  try {
    console.log('Creating bhajans table…');
    await pool.query(SQL);
    console.log('✅ Done. Table ready: bhajans');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
