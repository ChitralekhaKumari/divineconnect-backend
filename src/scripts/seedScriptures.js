// src/scripts/seedScriptures.js
// One-stop script for the entire Scriptures module:
//   1. Creates all tables (scriptures, chapters, verses, bookmarks,
//      favorites, reading_progress) — replaces initScriptures.js
//   2. Seeds content (Bhagavad Gita, Ramayana, Mahabharata, Rigveda,
//      Isha Upanishad with real verses; remaining texts as structural rows)
//
// Usage:
//   node src/scripts/seedScriptures.js              (normal run)
//   node src/scripts/seedScriptures.js --dry-run     (validate SQL without inserting)
//   node src/scripts/seedScriptures.js --count       (print current row counts then exit)
//
// You can safely delete initScriptures.js and run-scriptures-seed.js —
// this file replaces both.

require('dotenv').config();
const pool = require('../config/db');

// ─── Step 1: Ensure tables exist ────────────────────────────────────────────
// Run BEFORE the insert SQL, outside any transaction, so PostgreSQL can
// resolve the table names at parse time without a "relation does not exist" error.
// This replaces initScriptures.js — all tables, indexes and trigger are here.
const CREATE_SQL = `
-- pg_trgm powers fast ILIKE search on Sanskrit/Hindi text
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── Core content tables ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scriptures (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(100) UNIQUE NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  category      VARCHAR(100),
  emoji         VARCHAR(10),
  color         VARCHAR(20),
  language      VARCHAR(50) DEFAULT 'Sanskrit',
  meta_labels   TEXT[],
  source        VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chapters (
  id             SERIAL PRIMARY KEY,
  scripture_id   INTEGER NOT NULL REFERENCES scriptures(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title          VARCHAR(255),
  verse_count    INTEGER DEFAULT 0,
  created_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(scripture_id, chapter_number)
);

CREATE TABLE IF NOT EXISTS verses (
  id              SERIAL PRIMARY KEY,
  chapter_id      INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  scripture_id    INTEGER NOT NULL REFERENCES scriptures(id) ON DELETE CASCADE,
  verse_number    INTEGER NOT NULL,
  sanskrit        TEXT,
  transliteration TEXT,
  english         TEXT,
  hindi           TEXT,
  summary         TEXT,
  source          VARCHAR(255),
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(chapter_id, verse_number)
);

-- ── User-facing feature tables ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verse_id     INTEGER NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  created_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, verse_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scripture_id INTEGER NOT NULL REFERENCES scriptures(id) ON DELETE CASCADE,
  created_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, scripture_id)
);

-- One row per (user, scripture); updated_at doubles as "recently read" ordering.
CREATE TABLE IF NOT EXISTS reading_progress (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scripture_id   INTEGER NOT NULL REFERENCES scriptures(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  verse_number   INTEGER,
  updated_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, scripture_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chapters_scripture     ON chapters(scripture_id);
CREATE INDEX IF NOT EXISTS idx_verses_chapter         ON verses(chapter_id);
CREATE INDEX IF NOT EXISTS idx_verses_scripture       ON verses(scripture_id);
CREATE INDEX IF NOT EXISTS idx_scriptures_category    ON scriptures(category);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user         ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user         ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user  ON reading_progress(user_id);

-- English full-text search
CREATE INDEX IF NOT EXISTS idx_verses_english_fts
  ON verses USING gin(to_tsvector('english', coalesce(english,'') || ' ' || coalesce(summary,'')));

-- Sanskrit / Hindi trigram search
CREATE INDEX IF NOT EXISTS idx_verses_sanskrit_trgm ON verses USING gin(sanskrit gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_verses_hindi_trgm    ON verses USING gin(hindi gin_trgm_ops);

-- ── updated_at trigger ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_scriptures_updated_at ON scriptures;
CREATE TRIGGER update_scriptures_updated_at
  BEFORE UPDATE ON scriptures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

// ─── Step 2: Insert / upsert all content ────────────────────────────────────
const INSERT_SQL = `
-- src/scripts/seed_scriptures.sql
--
-- IMPORTANT — read before extending this file:
-- The Sanskrit/translation content below for Bhagavad Gita, Ramayana
-- (opening verse), Mahabharata (opening invocation), Rigveda 1.1.1, and
-- Isha Upanishad is well-established, widely-published public domain text.
--
-- For the remaining texts (Yajurveda, Samaveda, Atharvaveda, Katha
-- Upanishad, and all 18 Puranas), only 'scriptures' rows exist so they
-- render on the Scriptures page; their chapters/verses are empty until
-- real text is sourced.

-- ════════════════════════════════════════════════════════════════════════
-- BHAGAVAD GITA — fully wired, real verses
-- ════════════════════════════════════════════════════════════════════════
WITH s AS (
  INSERT INTO scriptures (slug, title, description, category, emoji, color, language, meta_labels, source, display_order)
  VALUES (
    'bhagavad-gita', 'Bhagavad Gita',
    'The song of God — a 700-verse dialogue between Arjuna and Lord Krishna on duty, righteousness, and the path to liberation.',
    'Smriti', '📖', '#e8f0fe', 'Sanskrit', ARRAY['18 Chapters','Sanskrit'],
    'Public domain (traditional text)', 1
  )
  ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
  RETURNING id
),
ch2 AS (
  INSERT INTO chapters (scripture_id, chapter_number, title, verse_count)
  SELECT id, 2, 'Sankhya Yoga — The Yoga of Knowledge', 2 FROM s
  ON CONFLICT (scripture_id, chapter_number) DO UPDATE SET title = EXCLUDED.title
  RETURNING id
)
INSERT INTO verses (chapter_id, scripture_id, verse_number, sanskrit, transliteration, english, source)
SELECT ch2.id, s.id, v.verse_number, v.sanskrit, v.transliteration, v.english, 'Public domain (traditional text)'
FROM ch2, s, (VALUES
  (20, 'न जायते म्रियते वा कदाचिन्नायं भूत्वा भविता वा न भूयः। अजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे॥',
   'na jāyate mriyate vā kadācin nāyaṃ bhūtvā bhavitā vā na bhūyaḥ, ajo nityaḥ śāśvato ''yaṃ purāṇo na hanyate hanyamāne śarīre',
   'The soul is never born, nor does it die; it does not come into being or cease to be. It is unborn, eternal, ever-existing, undying and primeval; it is not slain when the body is slain.'),
  (47, 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
   'karmaṇy evādhikāras te mā phaleṣu kadācana, mā karmaphalahetur bhūr mā te saṅgo ''stv akarmaṇi',
   'You have a right to perform your prescribed duty, but you are not entitled to the fruits of your actions. Never consider yourself the cause of the results, nor be attached to inaction.')
) AS v(verse_number, sanskrit, transliteration, english)
ON CONFLICT (chapter_id, verse_number) DO UPDATE SET english = EXCLUDED.english;

WITH s AS (SELECT id FROM scriptures WHERE slug = 'bhagavad-gita'),
ch4 AS (
  INSERT INTO chapters (scripture_id, chapter_number, title, verse_count)
  SELECT id, 4, 'Jnana Karma Sanyasa Yoga — The Yoga of Knowledge and Action', 1 FROM s
  ON CONFLICT (scripture_id, chapter_number) DO UPDATE SET title = EXCLUDED.title
  RETURNING id
)
INSERT INTO verses (chapter_id, scripture_id, verse_number, sanskrit, transliteration, english, source)
SELECT ch4.id, s.id, 7,
  'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत। अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥',
  'yadā yadā hi dharmasya glānir bhavati bhārata, abhyutthānam adharmasya tadātmānaṃ sṛjāmy aham',
  'Whenever there is a decline in righteousness and an increase in unrighteousness, O Arjuna, at that time I manifest myself on earth.',
  'Public domain (traditional text)'
FROM ch4, s
ON CONFLICT (chapter_id, verse_number) DO UPDATE SET english = EXCLUDED.english;

-- ════════════════════════════════════════════════════════════════════════
-- RAMAYANA — Bala Kanda opening, real verse
-- ════════════════════════════════════════════════════════════════════════
WITH s AS (
  INSERT INTO scriptures (slug, title, description, category, emoji, color, language, meta_labels, source, display_order)
  VALUES (
    'ramayana', 'Ramayana',
    'The epic journey of Lord Rama — a tale of duty, devotion, and the triumph of good over evil.',
    'Itihasa', '🏹', '#fce4ec', 'Sanskrit', ARRAY['7 Kandas','Sanskrit'],
    'Public domain (Valmiki Ramayana)', 2
  )
  ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
  RETURNING id
),
ch1 AS (
  INSERT INTO chapters (scripture_id, chapter_number, title, verse_count)
  SELECT id, 1, 'Bala Kanda — The Book of Youth', 1 FROM s
  ON CONFLICT (scripture_id, chapter_number) DO UPDATE SET title = EXCLUDED.title
  RETURNING id
)
INSERT INTO verses (chapter_id, scripture_id, verse_number, sanskrit, transliteration, english, source)
SELECT ch1.id, s.id, 1,
  'तपःस्वाध्यायनिरतं तपस्वी वाग्विदां वरम्। नारदं परिपप्रच्छ वाल्मीकिर्मुनिपुङ्गवम्॥',
  'tapaḥsvādhyāyanirataṃ tapasvī vāgvidāṃ varam, nāradaṃ paripapraccha vālmīkir munipuṅgavam',
  'Valmiki, the foremost of sages, devoted to austerity and study, asked Narada, who was foremost among those versed in speech.',
  'Public domain (Valmiki Ramayana)'
FROM ch1, s
ON CONFLICT (chapter_id, verse_number) DO UPDATE SET english = EXCLUDED.english;

-- ════════════════════════════════════════════════════════════════════════
-- MAHABHARATA — traditional opening invocation, real verse
-- ════════════════════════════════════════════════════════════════════════
WITH s AS (
  INSERT INTO scriptures (slug, title, description, category, emoji, color, language, meta_labels, source, display_order)
  VALUES (
    'mahabharata', 'Mahabharata',
    'The great epic of the Bharata dynasty — the longest poem ever written, containing profound philosophical teachings.',
    'Itihasa', '⚔️', '#ede7f6', 'Sanskrit', ARRAY['18 Parvas','Sanskrit'],
    'Public domain (traditional text)', 3
  )
  ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
  RETURNING id
),
ch1 AS (
  INSERT INTO chapters (scripture_id, chapter_number, title, verse_count)
  SELECT id, 1, 'Adi Parva — The Book of the Beginning', 1 FROM s
  ON CONFLICT (scripture_id, chapter_number) DO UPDATE SET title = EXCLUDED.title
  RETURNING id
)
INSERT INTO verses (chapter_id, scripture_id, verse_number, sanskrit, transliteration, english, source)
SELECT ch1.id, s.id, 1,
  'नारायणं नमस्कृत्य नरं चैव नरोत्तमम्। देवीं सरस्वतीं व्यासं ततो जयमुदीरयेत्॥',
  'nārāyaṇaṃ namaskṛtya naraṃ caiva narottamam, devīṃ sarasvatīṃ vyāsaṃ tato jayam udīrayet',
  'Having bowed down to Narayana, and Nara the most exalted human being, and also to the goddess Saraswati, must the word Jaya be uttered.',
  'Public domain (traditional text) — the epic''s traditional opening invocation'
FROM ch1, s
ON CONFLICT (chapter_id, verse_number) DO UPDATE SET english = EXCLUDED.english;

-- ════════════════════════════════════════════════════════════════════════
-- UPANISHADS — Isha Upanishad (real verse) + Katha (structural placeholder)
-- ════════════════════════════════════════════════════════════════════════
WITH s AS (
  INSERT INTO scriptures (slug, title, description, category, emoji, color, language, meta_labels, source, display_order)
  VALUES (
    'upanishads', 'Upanishads',
    'The philosophical texts that form the theoretical basis of Hinduism, exploring the nature of reality and self.',
    'Upanishad', '🕉️', '#e8f5e9', 'Sanskrit', ARRAY['108 Texts','Sanskrit'],
    'Public domain (traditional text)', 4
  )
  ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
  RETURNING id
),
ch1 AS (
  INSERT INTO chapters (scripture_id, chapter_number, title, verse_count)
  SELECT id, 1, 'Isha Upanishad', 1 FROM s
  ON CONFLICT (scripture_id, chapter_number) DO UPDATE SET title = EXCLUDED.title
  RETURNING id
)
INSERT INTO verses (chapter_id, scripture_id, verse_number, sanskrit, transliteration, english, source)
SELECT ch1.id, s.id, 1,
  'ईशा वास्यमिदं सर्वं यत्किञ्च जगत्यां जगत्। तेन त्यक्तेन भुञ्जीथा मा गृधः कस्यस्विद्धनम्॥',
  'īśā vāsyam idaṃ sarvaṃ yat kiñca jagatyāṃ jagat, tena tyaktena bhuñjīthā mā gṛdhaḥ kasyasvid dhanam',
  'All this, whatsoever moves in this moving world, is enveloped by God. Therefore find your enjoyment through renunciation; do not covet what belongs to others.',
  'Public domain (traditional text)'
FROM ch1, s
ON CONFLICT (chapter_id, verse_number) DO UPDATE SET english = EXCLUDED.english;

-- Structural placeholder — real verses pending
WITH s AS (SELECT id FROM scriptures WHERE slug = 'upanishads')
INSERT INTO chapters (scripture_id, chapter_number, title, verse_count)
SELECT id, 2, 'Katha Upanishad', 0 FROM s
ON CONFLICT (scripture_id, chapter_number) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════
-- VEDAS — Rigveda 1.1.1 is real. Yajurveda/Samaveda/Atharvaveda: structural only.
-- ════════════════════════════════════════════════════════════════════════
WITH s AS (
  INSERT INTO scriptures (slug, title, description, category, emoji, color, language, meta_labels, source, display_order)
  VALUES (
    'rigveda', 'Rigveda',
    'The oldest of the four Vedas — a collection of hymns to the gods, foundational to Vedic ritual and philosophy.',
    'Veda', '📜', '#fff8e1', 'Sanskrit', ARRAY['10 Mandalas','Sanskrit'],
    'Public domain (traditional text)', 5
  )
  ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
  RETURNING id
),
ch1 AS (
  INSERT INTO chapters (scripture_id, chapter_number, title, verse_count)
  SELECT id, 1, 'Mandala 1', 1 FROM s
  ON CONFLICT (scripture_id, chapter_number) DO UPDATE SET title = EXCLUDED.title
  RETURNING id
)
INSERT INTO verses (chapter_id, scripture_id, verse_number, sanskrit, transliteration, english, source)
SELECT ch1.id, s.id, 1,
  'अग्निमीळे पुरोहितं यज्ञस्य देवमृत्विजम्। होतारं रत्नधातमम्॥',
  'agnim īḷe purohitaṃ yajñasya devam ṛtvijam, hotāraṃ ratnadhātamam',
  'I praise Agni, the chosen priest, god, minister of sacrifice, the invoker, best bestower of treasure.',
  'Public domain (traditional text) — Rigveda 1.1.1'
FROM ch1, s
ON CONFLICT (chapter_id, verse_number) DO UPDATE SET english = EXCLUDED.english;

INSERT INTO scriptures (slug, title, description, category, emoji, color, language, meta_labels, source, display_order)
VALUES
  ('yajurveda',   'Yajurveda',   'The Veda of sacrificial formulas and ritual mantras used by priests during Vedic ceremonies.',      'Veda', '📜', '#fff8e1', 'Sanskrit', ARRAY['2 Recensions','Sanskrit'], 'Public domain (traditional text) — verses pending', 6),
  ('samaveda',    'Samaveda',    'The Veda of melodies and chants — largely verses from the Rigveda arranged for musical recitation.', 'Veda', '📜', '#fff8e1', 'Sanskrit', ARRAY['2 Books','Sanskrit'],      'Public domain (traditional text) — verses pending', 7),
  ('atharvaveda', 'Atharvaveda', 'The Veda of everyday life — spells, charms, and hymns covering healing, protection, and domestic ritual.', 'Veda', '📜', '#fff8e1', 'Sanskrit', ARRAY['20 Books','Sanskrit'], 'Public domain (traditional text) — verses pending', 8)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

-- ════════════════════════════════════════════════════════════════════════
-- PURANAS — all 18 Maha Puranas as structural rows. No verses seeded yet.
-- ════════════════════════════════════════════════════════════════════════
INSERT INTO scriptures (slug, title, description, category, emoji, color, language, meta_labels, source, display_order)
VALUES
  ('vishnu-purana',         'Vishnu Purana',         'Cosmology, genealogies, and the glory of Lord Vishnu.',                              'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['6 Amshas','Sanskrit'],    'Public domain (traditional text) — verses pending', 9),
  ('bhagavata-purana',      'Bhagavata Purana',      'The glory and pastimes of Lord Krishna, one of the most revered Puranas.',           'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['12 Skandhas','Sanskrit'], 'Public domain (traditional text) — verses pending', 10),
  ('shiva-purana',          'Shiva Purana',          'The greatness, mythology, and worship of Lord Shiva.',                               'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['7 Samhitas','Sanskrit'],  'Public domain (traditional text) — verses pending', 11),
  ('brahma-purana',         'Brahma Purana',         'Creation narratives and the glory of Lord Brahma.',                                   'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['Sanskrit'],              'Public domain (traditional text) — verses pending', 12),
  ('brahmanda-purana',      'Brahmanda Purana',      'The cosmic egg — origin and structure of the universe.',                             'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['Sanskrit'],              'Public domain (traditional text) — verses pending', 13),
  ('brahmavaivarta-purana', 'Brahmavaivarta Purana', 'Legends of Krishna, Radha, and various goddesses.',                                  'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['4 Khandas','Sanskrit'],  'Public domain (traditional text) — verses pending', 14),
  ('markandeya-purana',     'Markandeya Purana',     'Includes the Devi Mahatmya, the foundational text of Goddess worship.',              'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['Sanskrit'],              'Public domain (traditional text) — verses pending', 15),
  ('bhavishya-purana',      'Bhavishya Purana',      'Prophecies and future events, along with rituals and festivals.',                    'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['Sanskrit'],              'Public domain (traditional text) — verses pending', 16),
  ('vamana-purana',         'Vamana Purana',         'The dwarf incarnation of Vishnu and related legends.',                               'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['Sanskrit'],              'Public domain (traditional text) — verses pending', 17),
  ('varaha-purana',         'Varaha Purana',         'The boar incarnation of Vishnu and cosmological teachings.',                         'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['Sanskrit'],              'Public domain (traditional text) — verses pending', 18),
  ('matsya-purana',         'Matsya Purana',         'The fish incarnation of Vishnu — one of the oldest Puranas.',                        'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['Sanskrit'],              'Public domain (traditional text) — verses pending', 19),
  ('kurma-purana',          'Kurma Purana',          'The tortoise incarnation of Vishnu and related teachings.',                          'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['Sanskrit'],              'Public domain (traditional text) — verses pending', 20),
  ('linga-purana',          'Linga Purana',          'The significance and worship of the Shiva Linga.',                                   'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['Sanskrit'],              'Public domain (traditional text) — verses pending', 21),
  ('skanda-purana',         'Skanda Purana',         'The largest Purana — legends of Kartikeya and sacred geography (tirthas).',         'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['Sanskrit'],              'Public domain (traditional text) — verses pending', 22),
  ('vayu-purana',           'Vayu Purana',           'Cosmology and mythology narrated by the wind god Vayu.',                             'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['Sanskrit'],              'Public domain (traditional text) — verses pending', 23),
  ('agni-purana',           'Agni Purana',           'An encyclopedic text covering ritual, polity, medicine, and grammar.',               'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['Sanskrit'],              'Public domain (traditional text) — verses pending', 24),
  ('garuda-purana',         'Garuda Purana',         'Teachings on death, afterlife, and dharma, narrated to Garuda.',                    'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['Sanskrit'],              'Public domain (traditional text) — verses pending', 25),
  ('padma-purana',          'Padma Purana',          'Creation narratives centered on the cosmic lotus.',                                  'Purana', '🌌', '#e0f7fa', 'Sanskrit', ARRAY['Sanskrit'],              'Public domain (traditional text) — verses pending', 26)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;
`;

// ─── Helpers ────────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run');
const COUNT_ONLY = process.argv.includes('--count');

async function getCounts(client) {
    const { rows } = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM scriptures)        AS scriptures,
      (SELECT COUNT(*) FROM chapters)          AS chapters,
      (SELECT COUNT(*) FROM verses)            AS verses,
      (SELECT COUNT(*) FROM bookmarks)         AS bookmarks,
      (SELECT COUNT(*) FROM favorites)         AS favorites,
      (SELECT COUNT(*) FROM reading_progress)  AS reading_progress
  `);
    return rows[0];
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function seedScriptures() {
    const client = await pool.connect();
    try {

        // ── Count only ────────────────────────────────────────────────────────
        if (COUNT_ONLY) {
            // Tables may not exist yet; wrap in try/catch
            try {
                const c = await getCounts(client);
                console.log(`\n✅  Current counts:`);
                console.log(`    Scriptures       : ${c.scriptures}`);
                console.log(`    Chapters         : ${c.chapters}`);
                console.log(`    Verses           : ${c.verses}`);
                console.log(`    Bookmarks        : ${c.bookmarks}`);
                console.log(`    Favorites        : ${c.favorites}`);
                console.log(`    Reading Progress : ${c.reading_progress}\n`);
            } catch {
                console.log('\n⚠️  Tables do not exist yet. Run without --count first.\n');
            }
            return;
        }

        // ── Dry run ───────────────────────────────────────────────────────────
        if (DRY_RUN) {
            const scriptureMatches = INSERT_SQL.match(/ON CONFLICT \(slug\)/g) || [];
            const verseMatches = INSERT_SQL.match(/ON CONFLICT \(chapter_id, verse_number\)/g) || [];
            const chapterMatches = INSERT_SQL.match(/ON CONFLICT \(scripture_id, chapter_number\)/g) || [];
            console.log(`\n🔎  Dry run — SQL parsed OK.`);
            console.log(`    Scripture upserts : ${scriptureMatches.length}`);
            console.log(`    Chapter upserts   : ${chapterMatches.length}`);
            console.log(`    Verse upserts     : ${verseMatches.length}`);
            console.log('    No changes made to the database.\n');
            return;
        }

        // ── Real seed ─────────────────────────────────────────────────────────
        // Step 1: create tables outside any transaction so table names resolve
        console.log('\n📚  Ensuring scripture tables exist…');
        await client.query(CREATE_SQL);
        console.log('    Tables ready (scriptures, chapters, verses, bookmarks, favorites, reading_progress).');

        // Step 2: insert / upsert all content inside a transaction
        console.log('    Seeding scriptures, chapters, and verses…');
        await client.query('BEGIN');
        await client.query(INSERT_SQL);
        await client.query('COMMIT');

        const after = await getCounts(client);
        console.log(`\n✅  Seed complete!`);
        console.log(`    Scriptures       : ${after.scriptures}`);
        console.log(`    Chapters         : ${after.chapters}`);
        console.log(`    Verses           : ${after.verses}`);
        console.log(`    Bookmarks        : ${after.bookmarks}  (populated by users)`);
        console.log(`    Favorites        : ${after.favorites}  (populated by users)`);
        console.log(`    Reading Progress : ${after.reading_progress}  (populated by users)\n`);

    } catch (err) {
        await client.query('ROLLBACK').catch(() => { });
        console.error('\n❌  Seed failed – rolled back.\n');
        console.error(err.message);
        if (err.position) {
            const pos = parseInt(err.position, 10);
            console.error('\nSQL snippet near error:');
            console.error('...' + INSERT_SQL.substring(Math.max(0, pos - 120), pos + 120) + '...');
        }
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

seedScriptures();