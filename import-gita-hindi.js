/**
 * import-gita-hindi.js
 *
 * Backfills the `hindi` column on your already-imported Bhagavad Gita
 * verses, using the "Shreemad Bhagvad Geeta" API (by rkgcode) on RapidAPI —
 * a different API from the one import-gita.js used, because that one
 * doesn't return Hindi text.
 *
 * Run import-gita.js FIRST (it creates the scripture/chapters/verses rows).
 * This script only UPDATEs the hindi column on rows that already exist —
 * it does not create new verses.
 *
 * This API is verse-by-verse (no bulk "get all" endpoint), so this makes
 * one request per verse — 701 requests total, with a short delay between
 * each to stay well under free-tier rate limits. Expect this to take a
 * few minutes.
 *
 * Setup:
 *   1. On RapidAPI, open "Shreemad Bhagvad Geeta" (by rkgcode)
 *   2. Click "Subscribe to Test" and pick the free tier
 *      (this is a SEPARATE subscription from the bhagavad-gita3 API,
 *      even though you use the same account/key)
 *   3. Your .env RAPIDAPI_KEY from before works — same account, so no
 *      new env var needed
 *
 * Usage:
 *   node import-gita-hindi.js
 */

require('dotenv').config();
const axios = require('axios');
const pool = require('./src/config/db');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'shreemad-bhagvad-geeta.p.rapidapi.com';

const client = axios.create({
    baseURL: `https://${RAPIDAPI_HOST}`,
    headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
    },
});

// Known, fixed verse counts per chapter (confirmed against your import-gita.js run)
const VERSES_PER_CHAPTER = {
    1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47,
    7: 30, 8: 28, 9: 34, 10: 42, 11: 55, 12: 20,
    13: 35, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78,
};

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getScriptureId() {
    const { rows } = await pool.query(`SELECT id FROM scriptures WHERE slug = 'bhagavad-gita'`);
    if (!rows.length) {
        throw new Error(`No "bhagavad-gita" scripture found. Run import-gita.js first.`);
    }
    return rows[0].id;
}

async function getChapterIdMap(scriptureId) {
    const { rows } = await pool.query(
        `SELECT chapter_number, id FROM chapters WHERE scripture_id = $1`,
        [scriptureId]
    );
    const map = {};
    rows.forEach((r) => { map[r.chapter_number] = r.id; });
    return map;
}

async function main() {
    if (!RAPIDAPI_KEY) {
        console.error('❌ Missing RAPIDAPI_KEY in your .env file.');
        process.exit(1);
    }

    console.log('🕉️  Backfilling Hindi translations for the Bhagavad Gita...\n');

    const scriptureId = await getScriptureId();
    const chapterIdMap = await getChapterIdMap(scriptureId);

    let totalUpdated = 0;
    let totalFailed = 0;

    for (let chapter = 1; chapter <= 18; chapter++) {
        const chapterId = chapterIdMap[chapter];
        if (!chapterId) {
            console.log(`  ⚠️  Chapter ${chapter} not found in your DB — skipping. Run import-gita.js first.`);
            continue;
        }

        const verseCount = VERSES_PER_CHAPTER[chapter];
        let chapterUpdated = 0;
        let loggedErrorThisRun = global.__loggedGitaHindiError || false;

        for (let verse = 1; verse <= verseCount; verse++) {
            try {
                const { data } = await client.get(`/shlokas/${chapter}/${verse}`);
                const hindi = data?.data?.hindi;

                if (hindi) {
                    await pool.query(
                        `UPDATE verses SET hindi = $1 WHERE chapter_id = $2 AND verse_number = $3`,
                        [hindi, chapterId, verse]
                    );
                    chapterUpdated++;
                    totalUpdated++;
                } else {
                    totalFailed++;
                    if (!loggedErrorThisRun) {
                        console.log(`\n  ⚠️  No hindi field in response for ${chapter}/${verse}. Full response:`, JSON.stringify(data));
                        loggedErrorThisRun = true;
                        global.__loggedGitaHindiError = true;
                    }
                }
            } catch (err) {
                totalFailed++;
                if (!loggedErrorThisRun) {
                    console.log(`\n  ❌ Request failed for ${chapter}/${verse}:`);
                    console.log(`     Status: ${err.response?.status}`);
                    console.log(`     Body: ${JSON.stringify(err.response?.data)}`);
                    console.log(`     Message: ${err.message}\n`);
                    loggedErrorThisRun = true;
                    global.__loggedGitaHindiError = true;
                }
            }
            await sleep(150);
        }

        console.log(`  ✅ Chapter ${chapter}: ${chapterUpdated}/${verseCount} verses updated with Hindi`);
    }

    console.log(`\n✅ Done. ${totalUpdated} verses updated, ${totalFailed} failed/missing.`);
    await pool.end();
}

main().catch(async (err) => {
    console.error('❌ Import failed:', err.message);
    await pool.end();
    process.exit(1);
});
