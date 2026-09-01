const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// ─── Data source ────────────────────────────────────────────────────────────
// Scripture content is static — it never changes — so instead of a database
// (scriptures / chapters / verses tables) we keep ONE .md file per scripture
// inside /scriptures (project root), same pattern as /prayers.
//
// File format:
//
//   ---
//   id: 1
//   slug: bhagavad-gita
//   title: Bhagavad Gita
//   description: The song of God — ...
//   category: Smriti
//   emoji: 📖
//   color: "#e8f0fe"
//   language: Sanskrit
//   meta_labels: [18 Chapters, Sanskrit]
//   source: Public domain (traditional text)
//   display_order: 1
//   ---
//   ## Chapter 1: Arjuna Vishada Yoga
//
//   ### Verse 1
//   **Sanskrit:** ...
//   **Transliteration:** ...
//   **English:** ...
//   **Hindi:** ...
//   **Summary:** ...
//
//   ### Verse 2
//   ...
//
//   ## Chapter 2: ...
//
// A scripture with no chapters yet (verses "pending") is just the
// frontmatter block with an empty body — it still shows up in the list,
// with an empty `chapters` array.
// ─────────────────────────────────────────────────────────────────────────

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

    if (matches.length > 0) {
        return matches.map((m, i) => {
            const start = m.index + m[0].length;
            const end = i + 1 < matches.length ? matches[i + 1].index : chapterBody.length;
            return {
                verseNumber: parseInt(m[1], 10),
                fields: parseFields(chapterBody.slice(start, end)),
            };
        });
    }

    // ── Fallback: raw "Sukta" format (currently only rigveda.md) ──────────
    // Some source files were never converted to the "### Verse N" schema —
    // they're a straight scrape of "--- Sukta N ---" blocks, each holding
    // plain "M | <sanskrit line>" mantra lines. Rather than rewriting that
    // data file, treat each Sukta as one browsable unit ("verse" in API
    // terms) whose Sanskrit field is every mantra line joined together.
    return splitSuktas(chapterBody);
}

function splitSuktas(chapterBody) {
    const suktaRe = /^---\s*Sukta\s+(\d+)\s*---\s*$/gim;
    const suktaMatches = [...chapterBody.matchAll(suktaRe)];
    if (suktaMatches.length === 0) return [];

    const mantraLineRe = /^(\d+)\s*\|\s*(.+)$/gm;

    return suktaMatches.map((m, i) => {
        const start = m.index + m[0].length;
        const end = i + 1 < suktaMatches.length ? suktaMatches[i + 1].index : chapterBody.length;
        const block = chapterBody.slice(start, end);

        const mantraLines = [...block.matchAll(mantraLineRe)].map((mm) => mm[2].trim());

        return {
            verseNumber: parseInt(m[1], 10),
            fields: {
                sanskrit: mantraLines.join('\n\n'),
                summary: `${mantraLines.length} mantra${mantraLines.length === 1 ? '' : 's'}`,
            },
            isSukta: true,
            mantraCount: mantraLines.length,
        };
    });
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
            // Only set on entries parsed via the raw Sukta fallback (see
            // splitSuktas) — lets the frontend label these "Sukta N"
            // instead of "Verse N" and render mantra lines distinctly.
            is_sukta: v.isSukta || false,
            mantra_count: v.mantraCount ?? null,
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
        image_url: data.image_url || null,
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