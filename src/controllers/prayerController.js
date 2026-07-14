const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// ─── Data source ────────────────────────────────────────────────────────────
// Prayer content never changes, so instead of a database table we keep one
// .md file per prayer inside /prayers (project root). Each file has YAML
// frontmatter (id, title, deity, frequency, slug) followed by four markdown
// sections: ## Sanskrit / ## Transliteration / ## Meaning / ## Benefits.
// ─────────────────────────────────────────────────────────────────────────

const CWD_PRAYERS_DIR = path.join(process.cwd(), 'prayers');
const DIRNAME_PRAYERS_DIR = path.join(__dirname, '..', '..', 'prayers');
const PRAYERS_DIR = fs.existsSync(CWD_PRAYERS_DIR) ? CWD_PRAYERS_DIR : DIRNAME_PRAYERS_DIR;

// Pull the text under a "## Heading" until the next "## " or end of string.
function extractSection(body, heading) {
  const re = new RegExp(`##\\s*${heading}\\s*\\n+([\\s\\S]*?)(?=\\n##\\s|$)`, 'i');
  const match = body.match(re);
  return match ? match[1].trim() : '';
}

function parsePrayerFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);

  return {
    id: data.id,
    title: data.title,
    deity: data.deity,
    frequency: data.frequency,
    slug: data.slug || path.basename(filePath, '.md'),
    sanskrit: extractSection(content, 'Sanskrit'),
    transliteration: extractSection(content, 'Transliteration'),
    meaning: extractSection(content, 'Meaning'),
    benefits: extractSection(content, 'Benefits'),
  };
}

// Loaded once per process and cached — see note above on why this is safe.
let cache = null;

function loadPrayers() {
  if (cache) return cache;

  if (!fs.existsSync(PRAYERS_DIR)) {
    console.error(`Prayers directory not found at ${PRAYERS_DIR}`);
    cache = [];
    return cache;
  }

  const files = fs.readdirSync(PRAYERS_DIR).filter((f) => f.endsWith('.md'));

  cache = files
    .map((f) => parsePrayerFile(path.join(PRAYERS_DIR, f)))
    .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

  return cache;
}

// ─── GET /api/prayers ──────────────────────────────────────────────────────
// Query params:
//   category (Savitri | Shiva | Hanuman | Vishnu | Lakshmi | Ganesha | ...)
// ─────────────────────────────────────────────────────────────────────────
async function getPrayers(req, res) {
  try {
    const category = (req.query.category || '').trim();
    let prayers = loadPrayers();

    if (category && category.toLowerCase() !== 'all') {
      prayers = prayers.filter(
        (p) => p.deity.toLowerCase() === category.toLowerCase()
      );
    }

    res.json({ success: true, data: prayers });
  } catch (err) {
    console.error('getPrayers error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── GET /api/prayers/categories ───────────────────────────────────────────
async function getPrayerCategories(req, res) {
  try {
    const prayers = loadPrayers();
    const categories = [...new Set(prayers.map((p) => p.deity))].sort();
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error('getPrayerCategories error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── GET /api/prayers/:slug ─────────────────────────────────────────────────
// Single prayer by slug or numeric id — handy for direct-linking a prayer.
// ─────────────────────────────────────────────────────────────────────────
async function getPrayerBySlug(req, res) {
  try {
    const { slug } = req.params;
    const prayers = loadPrayers();
    const prayer = prayers.find(
      (p) => p.slug === slug || String(p.id) === slug
    );

    if (!prayer) {
      return res.status(404).json({ success: false, message: 'Prayer not found' });
    }

    res.json({ success: true, data: prayer });
  } catch (err) {
    console.error('getPrayerBySlug error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getPrayers, getPrayerCategories, getPrayerBySlug };
