// Resumable Hindi backfill for scriptures/bhagavad-gita.md
//
// Unlike fetch-gita-to-md.js (which re-fetches EVERYTHING from the main
// Gita API and needs all 18 chapters to succeed in one run), this script:
//   - only touches the Hindi API (shreemad-bhagvad-geeta)
//   - reuses the Sanskrit / Transliteration / English already in your .md
//   - skips any verse that already has a **Hindi:** line
//   - saves progress to disk after every chapter, so if you hit the
//     monthly quota partway through, nothing is lost — just re-run this
//     later (next month, or after upgrading your RapidAPI plan) and it
//     will continue from wherever it stopped.
//
// Usage: node backfill-gita-hindi.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const OUT_PATH = path.join(__dirname, 'scriptures', 'bhagavad-gita.md');

const hindiClient = axios.create({
    baseURL: 'https://shreemad-bhagvad-geeta.p.rapidapi.com',
    headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'shreemad-bhagvad-geeta.p.rapidapi.com',
    },
});

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function safe(text) {
    if (!text) return '';
    return String(text).replace(/\r\n/g, '\n').trim();
}

// Splits on "## Chapter N: Title" headings — same convention as scriptureLoader.js
function splitChapters(body) {
    const re = /^##\s*Chapter\s+(\d+)\s*(?::\s*(.*))?\s*$/gim;
    const matches = [...body.matchAll(re)];
    const chapters = [];
    matches.forEach((m, i) => {
        const start = m.index;
        const end = i + 1 < matches.length ? matches[i + 1].index : body.length;
        chapters.push({
            chapterNumber: parseInt(m[1], 10),
            headingLine: m[0],
            fullBlock: body.slice(start, end), // heading + body, verbatim
        });
    });
    return chapters;
}

// Splits a chapter's full block (heading + verses) on "### Verse N" headings.
function splitVerses(chapterBlock) {
    const re = /^###\s*Verse\s+(\d+)\s*$/gim;
    const matches = [...chapterBlock.matchAll(re)];
    const verses = [];
    matches.forEach((m, i) => {
        const start = m.index;
        const end = i + 1 < matches.length ? matches[i + 1].index : chapterBlock.length;
        verses.push({
            verseNumber: parseInt(m[1], 10),
            block: chapterBlock.slice(start, end),
        });
    });
    // Everything before the first "### Verse" (i.e. the "## Chapter N: Title" line itself)
    const preamble = matches.length ? chapterBlock.slice(0, matches[0].index) : chapterBlock;
    return { preamble, verses };
}

async function fetchHindi(chapter, verse) {
    try {
        const { data } = await hindiClient.get(`/shlokas/${chapter}/${verse}`);
        // API returns hindi directly on the object, not nested under data.data
        const hindi = data?.hindi || data?.data?.hindi;
        return { ok: true, hindi: hindi || null };
    } catch (err) {
        if (err.response?.status === 429) {
            return { ok: false, quotaExceeded: true, message: err.response?.data?.message };
        }
        return { ok: false, quotaExceeded: false, message: err.response?.data?.message || err.message };
    }
}

async function main() {
    if (!RAPIDAPI_KEY) {
        console.error('❌ Missing RAPIDAPI_KEY in your .env file.');
        process.exit(1);
    }
    if (!fs.existsSync(OUT_PATH)) {
        console.error(`❌ ${OUT_PATH} not found. Run fetch-gita-to-md.js first to create it.`);
        process.exit(1);
    }

    const raw = fs.readFileSync(OUT_PATH, 'utf8');

    // Split off frontmatter (--- ... ---) from the body ourselves, so we can
    // put the file back together byte-for-byte identical apart from the
    // **Hindi:** lines we add.
    const fmMatch = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
    if (!fmMatch) {
        console.error('❌ Could not find frontmatter block at the top of the file. Aborting.');
        process.exit(1);
    }
    const frontmatter = fmMatch[0];
    const body = raw.slice(frontmatter.length);

    const chapters = splitChapters(body);
    if (chapters.length === 0) {
        console.error('❌ No "## Chapter N" headings found. Aborting.');
        process.exit(1);
    }

    // One-time backup before we touch anything.
    const backupPath = OUT_PATH.replace(/\.md$/, `.backup-${Date.now()}.md`);
    fs.copyFileSync(OUT_PATH, backupPath);
    console.log(`🗄️  Backed up current file to ${backupPath}\n`);

    console.log('🕉️  Backfilling Hindi into bhagavad-gita.md (resumable)...\n');

    let totalFilled = 0;
    let totalSkippedAlready = 0;
    let quotaHit = false;

    for (const chapter of chapters) {
        if (quotaHit) break;

        const { preamble, verses } = splitVerses(chapter.fullBlock);
        let chapterFilled = 0;
        let chapterAlready = 0;

        for (const v of verses) {
            if (quotaHit) break;

            if (/^\*\*Hindi:\*\*/im.test(v.block)) {
                chapterAlready++;
                totalSkippedAlready++;
                continue; // already has Hindi — leave untouched
            }

            const result = await fetchHindi(chapter.chapterNumber, v.verseNumber);

            if (result.ok && result.hindi) {
                // Append the Hindi line at the end of the verse block, trimmed,
                // then restore a trailing blank line for spacing between verses.
                v.block = v.block.trimEnd() + `\n**Hindi:** ${safe(result.hindi)}\n\n`;
                chapterFilled++;
                totalFilled++;
            } else if (result.quotaExceeded) {
                console.log(`\n  ⛔ Monthly quota exceeded at Chapter ${chapter.chapterNumber}, Verse ${v.verseNumber}.`);
                console.log(`     ${result.message || ''}`);
                console.log('     Progress so far has been saved. Re-run this script later (quota reset, or after upgrading your plan) to continue.\n');
                quotaHit = true;
            } else if (!result.ok) {
                console.log(`  ⚠️  ${chapter.chapterNumber}/${v.verseNumber} failed: ${result.message}`);
            }

            await sleep(150);
        }

        console.log(`  ✅ Chapter ${chapter.chapterNumber}: +${chapterFilled} Hindi added, ${chapterAlready} already had it`);

        // Reassemble this chapter's block and write the WHOLE file after every
        // chapter — so progress survives even if the process is killed or the
        // quota runs out mid-chapter.
        chapter.fullBlock = preamble + verses.map((v) => v.block).join('');
        const newBody = chapters.map((c) => c.fullBlock).join('');
        fs.writeFileSync(OUT_PATH, frontmatter + '\n' + newBody, 'utf8');
    }

    console.log(`\n✅ Done for this run. ${totalFilled} verses newly filled, ${totalSkippedAlready} already had Hindi.`);
    if (quotaHit) {
        console.log('   Re-run this script again later to continue where it left off.');
    } else {
        console.log('   All verses processed — check above for any that failed for other reasons.');
    }
}

main().catch((err) => {
    console.error('❌ Backfill failed:', err.message);
    process.exit(1);
});