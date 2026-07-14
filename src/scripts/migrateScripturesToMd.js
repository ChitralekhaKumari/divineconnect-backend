// src/scripts/migrateScripturesToMd.js
//
// One-time migration for the switch from DB-backed scriptures to
// /scriptures/*.md files (same pattern as /prayers).
//
//   1. Creates the new, slug-keyed user tables:
//        scripture_bookmarks        (user_id, scripture_slug, chapter_number, verse_number)
//        scripture_favorites        (user_id, scripture_slug)
//        scripture_reading_progress (user_id, scripture_slug, chapter_number, verse_number)
//   2. Drops the old content tables (scriptures, chapters, verses) and the
//      old id-keyed user tables (bookmarks, favorites, reading_progress) —
//      their data can't carry over 1:1 since verse identity has changed
//      from a numeric DB id to (slug, chapter, verse).
//
// Run once:
//   node src/scripts/migrateScripturesToMd.js
//
// If you have existing bookmarks/favorites you want to preserve, export them
// BEFORE running this (e.g. `SELECT * FROM bookmarks`, `SELECT * FROM favorites`)
// and re-insert manually against the new schema — this script does not
// attempt an automatic data migration since old verse rows may already be
// mid-flight to removal.

require('dotenv').config();
const pool = require('../config/db');

const SQL = `
CREATE TABLE IF NOT EXISTS scripture_bookmarks (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scripture_slug VARCHAR(100) NOT NULL,
  chapter_number INTEGER NOT NULL,
  verse_number   INTEGER NOT NULL,
  created_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, scripture_slug, chapter_number, verse_number)
);

CREATE TABLE IF NOT EXISTS scripture_favorites (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scripture_slug VARCHAR(100) NOT NULL,
  created_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, scripture_slug)
);

CREATE TABLE IF NOT EXISTS scripture_reading_progress (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scripture_slug VARCHAR(100) NOT NULL,
  chapter_number INTEGER NOT NULL,
  verse_number   INTEGER,
  updated_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, scripture_slug)
);

CREATE INDEX IF NOT EXISTS idx_scripture_bookmarks_user ON scripture_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_scripture_favorites_user ON scripture_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_scripture_progress_user  ON scripture_reading_progress(user_id);

-- Old content + id-keyed user tables — superseded by /scriptures/*.md
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS reading_progress CASCADE;
DROP TABLE IF EXISTS verses CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS scriptures CASCADE;
`;

async function main() {
    const client = await pool.connect();
    try {
        console.log('\n📚  Migrating scriptures: DB tables → /scriptures/*.md ...');
        await client.query(SQL);
        console.log('✅  Done.');
        console.log('    Created: scripture_bookmarks, scripture_favorites, scripture_reading_progress');
        console.log('    Dropped: scriptures, chapters, verses, bookmarks, favorites, reading_progress\n');
    } catch (err) {
        console.error('❌  Migration failed:', err.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

main();
