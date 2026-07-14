// One-off generator: writes the initial /scriptures/*.md files using the
// same content that used to live in src/scripts/seedScriptures.js.
//
// NOTE: bhagavad-gita.md and ramayana.md written here are placeholders
// (a couple of sample verses each, same as the old DB seed had) — they get
// fully replaced by fetch-gita-to-md.js and ramayana-json-to-md.js.
//
// This script is a one-time tool, not part of the running app — safe to
// delete after running once.

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', '..', 'scriptures');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function fm(obj) {
    const lines = ['---'];
    for (const [k, v] of Object.entries(obj)) {
        if (Array.isArray(v)) {
            lines.push(`${k}: [${v.map((x) => JSON.stringify(x)).join(', ')}]`);
        } else if (typeof v === 'string') {
            lines.push(`${k}: ${JSON.stringify(v)}`);
        } else {
            lines.push(`${k}: ${v}`);
        }
    }
    lines.push('---', '');
    return lines.join('\n');
}

function verseBlock(v) {
    const lines = [`### Verse ${v.verse_number}`];
    if (v.sanskrit) lines.push(`**Sanskrit:** ${v.sanskrit}`);
    if (v.transliteration) lines.push(`**Transliteration:** ${v.transliteration}`);
    if (v.english) lines.push(`**English:** ${v.english}`);
    if (v.hindi) lines.push(`**Hindi:** ${v.hindi}`);
    if (v.summary) lines.push(`**Summary:** ${v.summary}`);
    return lines.join('\n');
}

function chapterBlock(c) {
    const header = `## Chapter ${c.chapter_number}${c.title ? `: ${c.title}` : ''}`;
    const verses = (c.verses || []).map(verseBlock).join('\n\n');
    return verses ? `${header}\n\n${verses}` : header;
}

function writeScripture(meta, chapters = []) {
    const body = chapters.map(chapterBlock).join('\n\n');
    const content = fm(meta) + (body ? `\n${body}\n` : '\n');
    const outPath = path.join(OUT_DIR, `${meta.slug}.md`);
    fs.writeFileSync(outPath, content, 'utf8');
    console.log(`  ✅ ${meta.slug}.md`);
}

// ── 1. Bhagavad Gita (placeholder — replaced by fetch-gita-to-md.js) ───────
writeScripture(
    {
        id: 1, slug: 'bhagavad-gita', title: 'Bhagavad Gita',
        description: 'The song of God — a 700-verse dialogue between Arjuna and Lord Krishna on duty, righteousness, and the path to liberation.',
        category: 'Smriti', emoji: '📖', color: '#e8f0fe', language: 'Sanskrit',
        meta_labels: ['18 Chapters', 'Sanskrit'],
        source: 'Public domain (traditional text) — placeholder, run fetch-gita-to-md.js for the full text',
        display_order: 1,
    },
    [
        {
            chapter_number: 2, title: 'Sankhya Yoga — The Yoga of Knowledge',
            verses: [
                {
                    verse_number: 20,
                    sanskrit: 'न जायते म्रियते वा कदाचिन्नायं भूत्वा भविता वा न भूयः। अजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे॥',
                    transliteration: "na jāyate mriyate vā kadācin nāyaṃ bhūtvā bhavitā vā na bhūyaḥ, ajo nityaḥ śāśvato 'yaṃ purāṇo na hanyate hanyamāne śarīre",
                    english: 'The soul is never born, nor does it die; it does not come into being or cease to be. It is unborn, eternal, ever-existing, undying and primeval; it is not slain when the body is slain.',
                },
                {
                    verse_number: 47,
                    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
                    transliteration: "karmaṇy evādhikāras te mā phaleṣu kadācana, mā karmaphalahetur bhūr mā te saṅgo 'stv akarmaṇi",
                    english: 'You have a right to perform your prescribed duty, but you are not entitled to the fruits of your actions. Never consider yourself the cause of the results, nor be attached to inaction.',
                },
            ],
        },
        {
            chapter_number: 4, title: 'Jnana Karma Sanyasa Yoga — The Yoga of Knowledge and Action',
            verses: [
                {
                    verse_number: 7,
                    sanskrit: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत। अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥',
                    transliteration: 'yadā yadā hi dharmasya glānir bhavati bhārata, abhyutthānam adharmasya tadātmānaṃ sṛjāmy aham',
                    english: 'Whenever there is a decline in righteousness and an increase in unrighteousness, O Arjuna, at that time I manifest myself on earth.',
                },
            ],
        },
    ]
);

// ── 2. Ramayana (placeholder — replaced by ramayana-json-to-md.js) ─────────
writeScripture(
    {
        id: 2, slug: 'ramayana', title: 'Ramayana',
        description: 'The epic journey of Lord Rama — a tale of duty, devotion, and the triumph of good over evil.',
        category: 'Itihasa', emoji: '🏹', color: '#fce4ec', language: 'Sanskrit',
        meta_labels: ['7 Kandas', 'Sanskrit'],
        source: 'Public domain (Valmiki Ramayana) — placeholder, run ramayana-json-to-md.js for the full text',
        display_order: 2,
    },
    [
        {
            chapter_number: 1, title: 'Bala Kanda — The Book of Youth',
            verses: [
                {
                    verse_number: 1,
                    sanskrit: 'तपःस्वाध्यायनिरतं तपस्वी वाग्विदां वरम्। नारदं परिपप्रच्छ वाल्मीकिर्मुनिपुङ्गवम्॥',
                    transliteration: 'tapaḥsvādhyāyanirataṃ tapasvī vāgvidāṃ varam, nāradaṃ paripapraccha vālmīkir munipuṅgavam',
                    english: 'Valmiki, the foremost of sages, devoted to austerity and study, asked Narada, who was foremost among those versed in speech.',
                },
            ],
        },
    ]
);

// ── 3. Mahabharata ──────────────────────────────────────────────────────────
writeScripture(
    {
        id: 3, slug: 'mahabharata', title: 'Mahabharata',
        description: 'The great epic of the Bharata dynasty — the longest poem ever written, containing profound philosophical teachings.',
        category: 'Itihasa', emoji: '⚔️', color: '#ede7f6', language: 'Sanskrit',
        meta_labels: ['18 Parvas', 'Sanskrit'],
        source: 'Public domain (traditional text)',
        display_order: 3,
    },
    [
        {
            chapter_number: 1, title: 'Adi Parva — The Book of the Beginning',
            verses: [
                {
                    verse_number: 1,
                    sanskrit: 'नारायणं नमस्कृत्य नरं चैव नरोत्तमम्। देवीं सरस्वतीं व्यासं ततो जयमुदीरयेत्॥',
                    transliteration: 'nārāyaṇaṃ namaskṛtya naraṃ caiva narottamam, devīṃ sarasvatīṃ vyāsaṃ tato jayam udīrayet',
                    english: 'Having bowed down to Narayana, and Nara the most exalted human being, and also to the goddess Saraswati, must the word Jaya be uttered.',
                    summary: "The epic's traditional opening invocation.",
                },
            ],
        },
    ]
);

// ── 4. Upanishads ───────────────────────────────────────────────────────────
writeScripture(
    {
        id: 4, slug: 'upanishads', title: 'Upanishads',
        description: 'The philosophical texts that form the theoretical basis of Hinduism, exploring the nature of reality and self.',
        category: 'Upanishad', emoji: '🕉️', color: '#e8f5e9', language: 'Sanskrit',
        meta_labels: ['108 Texts', 'Sanskrit'],
        source: 'Public domain (traditional text)',
        display_order: 4,
    },
    [
        {
            chapter_number: 1, title: 'Isha Upanishad',
            verses: [
                {
                    verse_number: 1,
                    sanskrit: 'ईशा वास्यमिदं सर्वं यत्किञ्च जगत्यां जगत्। तेन त्यक्तेन भुञ्जीथा मा गृधः कस्यस्विद्धनम्॥',
                    transliteration: 'īśā vāsyam idaṃ sarvaṃ yat kiñca jagatyāṃ jagat, tena tyaktena bhuñjīthā mā gṛdhaḥ kasyasvid dhanam',
                    english: 'All this, whatsoever moves in this moving world, is enveloped by God. Therefore find your enjoyment through renunciation; do not covet what belongs to others.',
                },
            ],
        },
        {
            chapter_number: 2, title: 'Katha Upanishad',
            verses: [], // structural placeholder — real verses pending
        },
    ]
);

// ── 5. Rigveda ───────────────────────────────────────────────────────────────
writeScripture(
    {
        id: 5, slug: 'rigveda', title: 'Rigveda',
        description: 'The oldest of the four Vedas — a collection of hymns to the gods, foundational to Vedic ritual and philosophy.',
        category: 'Veda', emoji: '📜', color: '#fff8e1', language: 'Sanskrit',
        meta_labels: ['10 Mandalas', 'Sanskrit'],
        source: 'Public domain (traditional text)',
        display_order: 5,
    },
    [
        {
            chapter_number: 1, title: 'Mandala 1',
            verses: [
                {
                    verse_number: 1,
                    sanskrit: 'अग्निमीळे पुरोहितं यज्ञस्य देवमृत्विजम्। होतारं रत्नधातमम्॥',
                    transliteration: 'agnim īḷe purohitaṃ yajñasya devam ṛtvijam, hotāraṃ ratnadhātamam',
                    english: 'I praise Agni, the chosen priest, god, minister of sacrifice, the invoker, best bestower of treasure.',
                    summary: 'Rigveda 1.1.1',
                },
            ],
        },
    ]
);

// ── 6-8. Yajurveda / Samaveda / Atharvaveda — structural only ──────────────
writeScripture({
    id: 6, slug: 'yajurveda', title: 'Yajurveda',
    description: 'The Veda of sacrificial formulas and ritual mantras used by priests during Vedic ceremonies.',
    category: 'Veda', emoji: '📜', color: '#fff8e1', language: 'Sanskrit',
    meta_labels: ['2 Recensions', 'Sanskrit'], source: 'Public domain (traditional text) — verses pending', display_order: 6,
});
writeScripture({
    id: 7, slug: 'samaveda', title: 'Samaveda',
    description: 'The Veda of melodies and chants — largely verses from the Rigveda arranged for musical recitation.',
    category: 'Veda', emoji: '📜', color: '#fff8e1', language: 'Sanskrit',
    meta_labels: ['2 Books', 'Sanskrit'], source: 'Public domain (traditional text) — verses pending', display_order: 7,
});
writeScripture({
    id: 8, slug: 'atharvaveda', title: 'Atharvaveda',
    description: 'The Veda of everyday life — spells, charms, and hymns covering healing, protection, and domestic ritual.',
    category: 'Veda', emoji: '📜', color: '#fff8e1', language: 'Sanskrit',
    meta_labels: ['20 Books', 'Sanskrit'], source: 'Public domain (traditional text) — verses pending', display_order: 8,
});

// ── 9-26. All 18 Maha Puranas — structural only ─────────────────────────────
const puranas = [
    ['vishnu-purana', 'Vishnu Purana', 'Cosmology, genealogies, and the glory of Lord Vishnu.', ['6 Amshas', 'Sanskrit']],
    ['bhagavata-purana', 'Bhagavata Purana', 'The glory and pastimes of Lord Krishna, one of the most revered Puranas.', ['12 Skandhas', 'Sanskrit']],
    ['shiva-purana', 'Shiva Purana', 'The greatness, mythology, and worship of Lord Shiva.', ['7 Samhitas', 'Sanskrit']],
    ['brahma-purana', 'Brahma Purana', 'Creation narratives and the glory of Lord Brahma.', ['Sanskrit']],
    ['brahmanda-purana', 'Brahmanda Purana', 'The cosmic egg — origin and structure of the universe.', ['Sanskrit']],
    ['brahmavaivarta-purana', 'Brahmavaivarta Purana', 'Legends of Krishna, Radha, and various goddesses.', ['4 Khandas', 'Sanskrit']],
    ['markandeya-purana', 'Markandeya Purana', 'Includes the Devi Mahatmya, the foundational text of Goddess worship.', ['Sanskrit']],
    ['bhavishya-purana', 'Bhavishya Purana', 'Prophecies and future events, along with rituals and festivals.', ['Sanskrit']],
    ['vamana-purana', 'Vamana Purana', 'The dwarf incarnation of Vishnu and related legends.', ['Sanskrit']],
    ['varaha-purana', 'Varaha Purana', 'The boar incarnation of Vishnu and cosmological teachings.', ['Sanskrit']],
    ['matsya-purana', 'Matsya Purana', 'The fish incarnation of Vishnu — one of the oldest Puranas.', ['Sanskrit']],
    ['kurma-purana', 'Kurma Purana', 'The tortoise incarnation of Vishnu and related teachings.', ['Sanskrit']],
    ['linga-purana', 'Linga Purana', 'The significance and worship of the Shiva Linga.', ['Sanskrit']],
    ['skanda-purana', 'Skanda Purana', 'The largest Purana — legends of Kartikeya and sacred geography (tirthas).', ['Sanskrit']],
    ['vayu-purana', 'Vayu Purana', 'Cosmology and mythology narrated by the wind god Vayu.', ['Sanskrit']],
    ['agni-purana', 'Agni Purana', 'An encyclopedic text covering ritual, polity, medicine, and grammar.', ['Sanskrit']],
    ['garuda-purana', 'Garuda Purana', 'Teachings on death, afterlife, and dharma, narrated to Garuda.', ['Sanskrit']],
    ['padma-purana', 'Padma Purana', 'Creation narratives centered on the cosmic lotus.', ['Sanskrit']],
];

puranas.forEach(([slug, title, description, meta_labels], i) => {
    writeScripture({
        id: 9 + i, slug, title, description,
        category: 'Purana', emoji: '🌌', color: '#e0f7fa', language: 'Sanskrit',
        meta_labels, source: 'Public domain (traditional text) — verses pending', display_order: 9 + i,
    });
});

console.log(`\n✅ Wrote ${5 + 3 + puranas.length} scripture .md files to ${OUT_DIR}\n`);
