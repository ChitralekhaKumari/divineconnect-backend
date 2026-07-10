require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

const gitaClient = axios.create({
    baseURL: 'https://bhagavad-gita3.p.rapidapi.com/v2',
    headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'bhagavad-gita3.p.rapidapi.com',
    },
});

const hindiClient = axios.create({
    baseURL: 'https://shreemad-bhagvad-geeta.p.rapidapi.com',
    headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'shreemad-bhagvad-geeta.p.rapidapi.com',
    },
});

const OUT_PATH = path.join(__dirname, 'scriptures', 'bhagavad-gita.md');

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

// Escapes anything that could be mistaken for our verse-field markers.
function safe(text) {
    if (!text) return '';
    return String(text).replace(/\r\n/g, '\n').trim();
}

function fmHeader() {
    return [
        '---',
        'id: 1',
        'slug: "bhagavad-gita"',
        'title: "Bhagavad Gita"',
        'description: "The song of God — a 700-verse dialogue between Arjuna and Lord Krishna on duty, righteousness, and the path to liberation."',
        'category: "Smriti"',
        'emoji: "📖"',
        'color: "#e8f0fe"',
        'language: "Sanskrit"',
        'meta_labels: ["18 Chapters", "Sanskrit"]',
        'source: "bhagavad-gita3 + Shreemad Bhagvad Geeta APIs (RapidAPI)"',
        'display_order: 1',
        '---',
        '',
    ].join('\n');
}

function verseBlock(v, hindi) {
    const lines = [`### Verse ${v.verse_number}`];
    if (v.text) lines.push(`**Sanskrit:** ${safe(v.text)}`);
    if (v.transliteration) lines.push(`**Transliteration:** ${safe(v.transliteration)}`);
    const english = pickTranslation(v.translations, 'english', 'Sivananda');
    if (english) lines.push(`**English:** ${safe(english)}`);
    if (hindi) lines.push(`**Hindi:** ${safe(hindi)}`);
    return lines.join('\n');
}

async function fetchHindiForChapter(chapter, verseCount) {
    const hindiByVerse = {};
    for (let verse = 1; verse <= verseCount; verse++) {
        try {
            const { data } = await hindiClient.get(`/shlokas/${chapter}/${verse}`);
            if (data?.data?.hindi) hindiByVerse[verse] = data.data.hindi;
        } catch {
            // Hindi is best-effort — missing hindi for a verse isn't fatal
        }
        await sleep(120);
    }
    return hindiByVerse;
}

async function main() {
    if (!RAPIDAPI_KEY) {
        console.error('❌ Missing RAPIDAPI_KEY in your .env file.');
        process.exit(1);
    }

    console.log('🕉️  Fetching the complete Bhagavad Gita from RapidAPI...\n');

    const chapterBlocks = [];

    for (let chapter = 1; chapter <= 18; chapter++) {
        try {
            const { data: chapterInfo } = await gitaClient.get(`/chapters/${chapter}/`);
            const { data: verses } = await gitaClient.get(`/chapters/${chapter}/verses/`);

            console.log(`  ⏳ Chapter ${chapter} (${chapterInfo.name_translated || chapterInfo.name}): fetching Hindi for ${verses.length} verses...`);
            const hindiByVerse = await fetchHindiForChapter(chapter, verses.length);

            const versesMd = verses
                .map((v) => verseBlock(v, hindiByVerse[v.verse_number]))
                .join('\n\n');

            chapterBlocks.push(
                `## Chapter ${chapter}: ${chapterInfo.name_translated || chapterInfo.name}\n\n${versesMd}`
            );

            const hindiCount = Object.keys(hindiByVerse).length;
            console.log(`  ✅ Chapter ${chapter}: ${verses.length} verses (${hindiCount} with Hindi)`);
        } catch (err) {
            console.error(`  ❌ Chapter ${chapter} failed:`, err.response?.data?.message || err.message);
        }
        await sleep(300);
    }

    const fullMd = fmHeader() + '\n' + chapterBlocks.join('\n\n') + '\n';
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, fullMd, 'utf8');

    console.log(`\n✅ Done. Wrote ${chapterBlocks.length} chapters to ${OUT_PATH}`);
}

main().catch((err) => {
    console.error('❌ Fetch failed:', err.message);
    process.exit(1);
});
