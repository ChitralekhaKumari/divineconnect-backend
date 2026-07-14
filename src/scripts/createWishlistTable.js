// src/scripts/createWishlistTable.js
//
// Creates the generic, cross-module `wishlist_items` table used by the
// Wishlist (heart icon) feature on Prayers, Scriptures, Temples, and any
// future module.
//
// One row = one user has wishlisted one item.
//   item_type -> 'prayer' | 'scripture' | 'temple' | ... (free text, extensible)
//   item_id   -> the id/slug of that item inside its own module
//
// We snapshot title/subtitle/image at add-time so the Wishlist page can
// render instantly without having to reach into 3 different data sources
// (prayers = .md files, scriptures = .md files, temples = Postgres) just
// to show a list. Existing per-module favorite tables (e.g.
// scripture_favorites) are left untouched — this is a separate, additive
// feature.
//
// Run once:
//   node src/scripts/createWishlistTable.js
//
require('dotenv').config();
const pool = require('../config/db');

const SQL = `
CREATE TABLE IF NOT EXISTS wishlist_items (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type   VARCHAR(30)  NOT NULL,
  item_id     VARCHAR(255) NOT NULL,
  title       VARCHAR(255),
  subtitle    VARCHAR(255),
  image_url   TEXT,
  meta        JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_type ON wishlist_items(user_id, item_type);
`;

async function run() {
  try {
    console.log('Creating wishlist_items table…');
    await pool.query(SQL);
    console.log('✅ Done. Table ready: wishlist_items');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
