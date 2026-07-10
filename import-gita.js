require('dotenv').config();
const axios = require('axios');
const pool = require('./src/config/db');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'bhagavad-gita3.p.rapidapi.com';

const client = axios.create({
    baseURL: `https://${RAPIDAPI_HOST}/v2`,
    headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
    },
});

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickTranslation(translations, language, preferredAuthorFragment) {
    if (!translations || !translations.length) return null;
    const inLang = translations.filter((t) => t.language === language);
    if (!inLang.length) return null;
    if (preferredAuthorFragment) {
        const preferred = inLang.find((t) => t.author_name?.includes(preferredAuthorFragment));
        if (preferred) return preferred.description;
    }
    return inLang[0].description;
}

async function upsertScripture() {
    const { rows } = await pool.query(
        `INSERT INTO scriptures
       (slug, title, description, category, emoji, color, language, meta_labels, source, display_order)
     VALUES
       ('bhagavad-gita', 'Bhagavad Gita',
        'The song of God — a 700-verse dialogue between Arjuna and Lord Krishna on duty, righteousness, and the path to liberation.',
        'Smriti', '📖', '#e8f0fe', 'Sanskrit', ARRAY['18 Chapters','Sanskrit'],
        'bhagavad-gita3 API (RapidAPI)', 1)
     ON CONFLICT (slug) DO UPDATE SET source = EXCLUDED.source
     RETURNING id`
    );
    return rows[0].id;
}

async function importChapter(scriptureId, chapterNumber) {
    const { data: chapterInfo } = await client.get(`/chapters/${chapterNumber}/`);
    const { data: verses } = await client.get(`/chapters/${chapterNumber}/verses/`);

    const { rows: chRows } = await pool.query(
        `INSERT INTO chapters (scripture_id, chapter_number, title, verse_count)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (scripture_id, chapter_number)
     DO UPDATE SET title = EXCLUDED.title, verse_count = EXCLUDED.verse_count
     RETURNING id`,
        [scriptureId, chapterNumber, chapterInfo.name_translated || chapterInfo.name, chapterInfo.verses_count]
    );
    const chapterId = chRows[0].id;

    let hindiFoundCount = 0;

    for (const v of verses) {
        const english = pickTranslation(v.translations, 'english', 'Sivananda');
        const hindi = pickTranslation(v.translations, 'hindi', 'Ramsukhdas');
        if (hindi) hindiFoundCount++;

        await pool.query(
            `INSERT INTO verses (chapter_id, scripture_id, verse_number, sanskrit, transliteration, english, hindi, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (chapter_id, verse_number) DO UPDATE SET
         sanskrit = EXCLUDED.sanskrit,
         transliteration = EXCLUDED.transliteration,
         english = EXCLUDED.english,
         hindi = EXCLUDED.hindi,
         source = EXCLUDED.source`,
            [chapterId, scriptureId, v.verse_number, v.text, v.transliteration, english, hindi, 'bhagavad-gita3 API (RapidAPI)']
        );
    }

    console.log(
        `  ✅ Chapter ${chapterNumber} (${chapterInfo.name_translated || chapterInfo.name}): ${verses.length} verses` +
        (hindiFoundCount === 0 ? '  ⚠️  no Hindi translation returned by API for this chapter' : ` (${hindiFoundCount} with Hindi)`)
    );
}

async function main() {
    if (!RAPIDAPI_KEY) {
        console.error('❌ Missing RAPIDAPI_KEY in your .env file. See the setup instructions at the top of this file.');
        process.exit(1);
    }

    console.log('🕉️  Importing the complete Bhagavad Gita from bhagavad-gita3 API...\n');
    const scriptureId = await upsertScripture();

    for (let chapter = 1; chapter <= 18; chapter++) {
        try {
            await importChapter(scriptureId, chapter);
        } catch (err) {
            console.error(`  ❌ Chapter ${chapter} failed:`, err.response?.data?.message || err.message);
        }
        await sleep(300); // small delay, polite to the free-tier rate limit
    }

    const { rows: counts } = await pool.query(
        `SELECT COUNT(*)::int AS chapters,
            (SELECT COUNT(*)::int FROM verses WHERE scripture_id = $1) AS verses,
            (SELECT COUNT(*)::int FROM verses WHERE scripture_id = $1 AND hindi IS NOT NULL) AS with_hindi
     FROM chapters WHERE scripture_id = $1`,
        [scriptureId]
    );

    console.log(`\n✅ Done. ${counts[0].chapters} chapters, ${counts[0].verses} verses, ${counts[0].with_hindi} with Hindi text.`);
    if (counts[0].with_hindi === 0) {
        console.log('⚠️  This API returned no Hindi translations at all — see note below.');
    }
    await pool.end();
}

main().catch(async (err) => {
    console.error('❌ Import failed:', err.message);
    await pool.end();
    process.exit(1);
});
