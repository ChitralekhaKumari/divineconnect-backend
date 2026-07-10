const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');


const CWD_SCRIPTURES_DIR = path.join(process.cwd(), 'scriptures');
const DIRNAME_SCRIPTURES_DIR = path.join(__dirname, '..', '..', 'scriptures');
const SCRIPTURES_DIR = fs.existsSync(CWD_SCRIPTURES_DIR) ? CWD_SCRIPTURES_DIR : DIRNAME_SCRIPTURES_DIR;

const VERSE_FIELDS = ['Sanskrit', 'Transliteration', 'English', 'Hindi', 'Summary'];

// Splits body text on "## Chapter N: Title" headings.
// Returns [{ chapterNumber, title, body }], in file order.
function splitChapters(body) {
    const re = /^##\s*Chapter\s+(\d+)\s*(?::\s*(.*))?\s*$/gim;
    const matches = [...body.matchAll(re)];
    const chapters = [];

    matches.forEach((m, i) => {
        const start = m.index + m[0].length;
        const end = i + 1 < matches.length ? matches[i + 1].index : body.length;
        chapters.push({
            chapterNumber: parseInt(m[1], 10),
            title: (m[2] || '').trim(),
            body: body.slice(start, end).trim(),
        });
    });

    return chapters;
}

// Splits a chapter body on "### Verse N" headings.
// Returns [{ verseNumber, fields }], in file order.
function splitVerses(chapterBody) {
    const re = /^###\s*Verse\s+(\d+)\s*$/gim;
    const matches = [...chapterBody.matchAll(re)];
    const verses = [];

    matches.forEach((m, i) => {
        const start = m.index + m[0].length;
        const end = i + 1 < matches.length ? matches[i + 1].index : chapterBody.length;
        verses.push({
            verseNumber: parseInt(m[1], 10),
            fields: parseFields(chapterBody.slice(start, end)),
        });
    });

    return verses;
}

// Pulls out **Label:** value pairs (Sanskrit / Transliteration / English /
// Hindi / Summary), each running until the next **Label:** or end of block.
function parseFields(text) {
    const labelAlt = VERSE_FIELDS.join('|');
    const re = new RegExp(`\\*\\*(${labelAlt}):\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*(?:${labelAlt}):\\*\\*|$)`, 'gi');
    const out = {};
    for (const m of text.matchAll(re)) {
        out[m[1].toLowerCase()] = m[2].trim();
    }
    return out;
}

function parseScriptureFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(raw);

    const chapters = splitChapters(content).map((ch) => {
        const verses = splitVerses(ch.body).map((v) => ({
            id: v.verseNumber, // stable within a chapter — used as React key / bookmark target
            verse_number: v.verseNumber,
            sanskrit: v.fields.sanskrit || null,
            transliteration: v.fields.transliteration || null,
            english: v.fields.english || null,
            hindi: v.fields.hindi || null,
            summary: v.fields.summary || null,
        }));
        return {
            chapter_number: ch.chapterNumber,
            title: ch.title || null,
            verse_count: verses.length,
            verses,
        };
    });

    return {
        id: data.id,
        slug: data.slug || path.basename(filePath, '.md'),
        title: data.title,
        description: data.description || '',
        category: data.category || 'Other',
        emoji: data.emoji || '📜',
        color: data.color || '#f5f0e8',
        language: data.language || 'Sanskrit',
        meta_labels: data.meta_labels || [],
        source: data.source || '',
        display_order: data.display_order ?? 0,
        chapters,
    };
}

// Loaded once per process and cached — content is static, see note above.
let cache = null;

function loadScriptures() {
    if (cache) return cache;

    if (!fs.existsSync(SCRIPTURES_DIR)) {
        console.error(`Scriptures directory not found at ${SCRIPTURES_DIR}`);
        cache = [];
        return cache;
    }

    const files = fs.readdirSync(SCRIPTURES_DIR).filter((f) => f.endsWith('.md'));

    cache = files
        .map((f) => parseScriptureFile(path.join(SCRIPTURES_DIR, f)))
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

    return cache;
}

// Flat list of every verse across every scripture, with parent context
// attached — used for search and "random verse".
function loadAllVersesFlat() {
    const scriptures = loadScriptures();
    const flat = [];
    for (const s of scriptures) {
        for (const ch of s.chapters) {
            for (const v of ch.verses) {
                flat.push({
                    ...v,
                    chapter_number: ch.chapter_number,
                    chapter_title: ch.title,
                    scripture_slug: s.slug,
                    scripture_title: s.title,
                });
            }
        }
    }
    return flat;
}

module.exports = { loadScriptures, loadAllVersesFlat, SCRIPTURES_DIR };
