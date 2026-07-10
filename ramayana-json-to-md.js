const fs = require('fs');
const path = require('path');

const KANDA_ORDER = [
    'Bala Kanda',
    'Ayodhya Kanda',
    'Aranya Kanda',
    'Kishkindha Kanda',
    'Sundara Kanda',
    'Yuddha Kanda',
    'Uttara Kanda',
];

const OUT_PATH = path.join(__dirname, 'scriptures', 'ramayana.md');
const inputPath = process.argv[2] || path.join(__dirname, 'data', 'ramayana.json');

function safe(text) {
    if (!text) return '';
    return String(text).replace(/\r\n/g, '\n').trim();
}

function buildSummary(translation, comments) {
    const parts = [];
    if (translation) parts.push(`Word meanings: ${safe(translation)}`);
    if (comments) parts.push(safe(comments));
    return parts.length ? parts.join('\n\n') : null;
}

function fmHeader() {
    return [
        '---',
        'id: 2',
        'slug: "ramayana"',
        'title: "Ramayana"',
        'description: "The epic journey of Lord Rama — a tale of duty, devotion, and the triumph of good over evil."',
        'category: "Itihasa"',
        'emoji: "🏹"',
        'color: "#fce4ec"',
        'language: "Sanskrit"',
        'meta_labels: ["7 Kandas", "648 Sargas", "Sanskrit"]',
        'source: "Valmiki_Ramayan_Dataset (AshuVj, GitHub, MIT License)"',
        'display_order: 2',
        '---',
        '',
    ].join('\n');
}

function verseBlock(s) {
    const lines = [`### Verse ${s.shloka}`];
    if (s.shloka_text) lines.push(`**Sanskrit:** ${safe(s.shloka_text)}`);
    if (s.transliteration) lines.push(`**Transliteration:** ${safe(s.transliteration)}`);
    if (s.explanation) lines.push(`**English:** ${safe(s.explanation)}`);
    const summary = buildSummary(s.translation, s.comments);
    if (summary) lines.push(`**Summary:** ${summary}`);
    return lines.join('\n');
}

function main() {
    if (!fs.existsSync(inputPath)) {
        console.error(`❌ Input JSON not found at ${inputPath}`);
        console.error('   Usage: node ramayana-json-to-md.js /path/to/Valmiki_Ramayan_Shlokas.json');
        process.exit(1);
    }

    console.log(`🏹 Reading ${inputPath} ...`);
    const allShlokas = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    console.log(`  ✅ Loaded ${allShlokas.length} shlokas`);

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
    const chapterBlocks = [];

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

            const versesMd = shlokas.map(verseBlock).join('\n\n');
            chapterBlocks.push(
                `## Chapter ${globalChapterNumber}: ${kandaName} · Sarga ${sargaNum}\n\n${versesMd}`
            );
            totalVerses += shlokas.length;
        }

        console.log(`  ✅ ${kandaName}: ${sargaNumbers.length} sargas (running total: ${globalChapterNumber} chapters, ${totalVerses} verses)`);
    }

    const fullMd = fmHeader() + '\n' + chapterBlocks.join('\n\n') + '\n';
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, fullMd, 'utf8');

    console.log(`\n✅ Done. Wrote ${globalChapterNumber} chapters, ${totalVerses} verses to ${OUT_PATH}`);
    console.log('ℹ️  No Hindi text in this dataset — omitted for every verse (reader UI already handles that).');
}

main();
