require('dotenv').config();
const pool = require('../config/db');

const SQL = `
ALTER TABLE temples
  ADD COLUMN IF NOT EXISTS status           VARCHAR(20) DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS slug             VARCHAR(255),
  ADD COLUMN IF NOT EXISTS seo_title        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS seo_description  TEXT,
  ADD COLUMN IF NOT EXISTS created_by       INTEGER REFERENCES users(id);

-- CHECK constraint added separately so re-running the migration doesn't error
DO $$ BEGIN
  ALTER TABLE temples ADD CONSTRAINT temples_status_check
    CHECK (status IN ('draft', 'published', 'archived'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_temples_slug ON temples(slug) WHERE slug IS NOT NULL;
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Adding status/slug/SEO columns to temples...');
    await client.query(SQL);

    // Every existing temple defaults to 'published' already (column default),
    // so nothing disappears from the public site. Just backfill slugs.
    console.log('Backfilling slugs for temples that don\'t have one...');
    const { rows } = await client.query(`SELECT id, name FROM temples WHERE slug IS NULL`);
    for (const t of rows) {
      const base = t.name.toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      const slug = `${base}-${t.id}`; // id suffix guarantees uniqueness without a retry loop
      await client.query(`UPDATE temples SET slug = $1 WHERE id = $2`, [slug, t.id]);
    }

    console.log(`✅ Done. ${rows.length} slugs backfilled. All existing temples remain 'published'.`);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();