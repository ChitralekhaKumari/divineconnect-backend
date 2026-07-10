require('dotenv').config();
const axios = require('axios');
const pool = require('./src/config/db');

const DATASET_URL =
    'https://raw.githubusercontent.com/AshuVj/Valmiki_Ramayan_Dataset/main/data/Valmiki_Ramayan_Shlokas.json';

// Traditional reading order. (Uttara Kanda is included for completeness —
// note it's widely considered a later addition, not part of the original
// text, but it's included here since the dataset provides it.)
const KANDA_ORDER = [
    'Bala Kanda',
    'Ayodhya Kanda',
    'Aranya Kanda',
    'Kishkindha Kanda',
    'Sundara Kanda',
    'Yuddha Kanda',
    'Uttara Kanda',
];

const BATCH_SIZE = 500; // verses per multi-row INSERT

async function upsertScripture() {
    // IMPORTANT: this writes into the 'ramayana' slug — the same row your
    // seed_scriptures.sql placeholder already created (with 1 sample
    // chapter/verse). It does NOT create a separate 'valmiki-ramayana' row.
    // ON CONFLICT (slug) DO UPDATE means this fills in / overwrites that
    // existing placeholder in place, so there's exactly one Ramayana card,
    // same id, same slug your frontend already links to.
    const { rows } = await pool.query(
        `INSERT INTO scriptures
       (slug, title, description, category, emoji, color, language, meta_labels, source, display_order)
     VALUES
       ('ramayana', 'Ramayana',
        'The epic journey of Lord Rama — a tale of duty, devotion, and the triumph of good over evil.',
        'Itihasa', '🏹', '#fce4ec', 'Sanskrit', ARRAY['7 Kandas','648 Sargas','Sanskrit'],
        'Valmiki_Ramayan_Dataset (AshuVj, GitHub, MIT License)', 2)
     ON CONFLICT (slug) DO UPDATE SET
       description = EXCLUDED.description,
       meta_labels = EXCLUDED.meta_labels,
       source = EXCLUDED.source
     RETURNING id`
    );
    return rows[0].id;
}

function buildSummary(translation, comments) {
    const parts = [];
    if (translation) parts.push(`Word meanings: ${translation}`);
    if (comments) parts.push(comments);
    return parts.length ? parts.join('\n\n') : null;
}

async function insertVerseBatch(client, rowsToInsert) {
    if (!rowsToInsert.length) return;

    const cols = ['chapter_id', 'scripture_id', 'verse_number', 'sanskrit', 'transliteration', 'english', 'hindi', 'summary', 'source'];
    const values = [];
    const placeholders = rowsToInsert.map((r, i) => {
        const base = i * cols.length;
        values.push(r.chapterId, r.scriptureId, r.verseNumber, r.sanskrit, r.transliteration, r.english, null, r.summary, r.source);
        return `(${cols.map((_, j) => `$${base + j + 1}`).join(', ')})`;
    });

    await client.query(
        `INSERT INTO verses (${cols.join(', ')})
     VALUES ${placeholders.join(', ')}
     ON CONFLICT (chapter_id, verse_number) DO UPDATE SET
       sanskrit = EXCLUDED.sanskrit,
       transliteration = EXCLUDED.transliteration,
       english = EXCLUDED.english,
       summary = EXCLUDED.summary,
       source = EXCLUDED.source`,
        values
    );
}

async function main() {
    console.log('🏹 Importing the complete Valmiki Ramayana...\n');

    console.log('  Downloading dataset (~30MB, this can take a moment)...');
    const { data: allShlokas } = await axios.get(DATASET_URL, { timeout: 120000 });
    console.log(`  ✅ Downloaded ${allShlokas.length} shlokas\n`);

    const scriptureId = await upsertScripture();
    const client = await pool.connect();

    try {
        // Group by kanda -> sarga, preserving shloka order within each sarga
        const byKanda = new Map();
        for (const s of allShlokas) {
            if (!byKanda.has(s.kanda)) byKanda.set(s.kanda, new Map());
            const bySarga = byKanda.get(s.kanda);
            if (!bySarga.has(s.sarga)) bySarga.set(s.sarga, []);
            bySarga.get(s.sarga).push(s);
        }

        let globalChapterNumber = 0;
        let totalVerses = 0;
        const source = 'Valmiki_Ramayan_Dataset (AshuVj, GitHub, MIT License)';

        for (const kandaName of KANDA_ORDER) {
            const bySarga = byKanda.get(kandaName);
            if (!bySarga) {
                console.log(`  ⚠️  "${kandaName}" not found in dataset, skipping`);
                continue;
            }

            const sargaNumbers = [...bySarga.keys()].sort((a, b) => a - b);

            for (const sargaNum of sargaNumbers) {
                globalChapterNumber += 1;
                const shlokas = bySarga.get(sargaNum).sort((a, b) => a.shloka - b.shloka);

                const { rows: chRows } = await client.query(
                    `INSERT INTO chapters (scripture_id, chapter_number, title, verse_count)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (scripture_id, chapter_number)
             DO UPDATE SET title = EXCLUDED.title, verse_count = EXCLUDED.verse_count
             RETURNING id`,
                    [scriptureId, globalChapterNumber, `${kandaName} · Sarga ${sargaNum}`, shlokas.length]
                );
                const chapterId = chRows[0].id;

                const rowsToInsert = shlokas.map((s) => ({
                    chapterId,
                    scriptureId,
                    verseNumber: s.shloka,
                    sanskrit: s.shloka_text || null,
                    transliteration: s.transliteration || null,
                    english: s.explanation || null,
                    summary: buildSummary(s.translation, s.comments),
                    source,
                }));

                for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
                    await insertVerseBatch(client, rowsToInsert.slice(i, i + BATCH_SIZE));
                }
                totalVerses += shlokas.length;
            }

            console.log(`  ✅ ${kandaName}: ${sargaNumbers.length} sargas imported (running total: ${globalChapterNumber} chapters, ${totalVerses} verses)`);
        }

        console.log(`\n✅ Done. ${globalChapterNumber} chapters (sargas), ${totalVerses} verses imported for Valmiki Ramayana.`);
        console.log('ℹ️  No Hindi text in this dataset — the `hindi` column is NULL for all Ramayana verses.');
        console.log('   Your reader UI already handles that (it only shows the Hindi block when `verse.hindi` is present).');
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(async (err) => {
    console.error('❌ Import failed:', err.response?.data?.message || err.message);
    try { await pool.end(); } catch (_) { /* noop */ }
    process.exit(1);
});