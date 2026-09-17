const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const github = require('../../services/githubService');

const CWD_PRAYERS_DIR = path.join(process.cwd(), 'prayers');
const DIRNAME_PRAYERS_DIR = path.join(__dirname, '..', '..', '..', 'prayers');
const PRAYERS_DIR = fs.existsSync(CWD_PRAYERS_DIR) ? CWD_PRAYERS_DIR : DIRNAME_PRAYERS_DIR;

// Path to the prayers folder *within the GitHub repo* — override with
// GITHUB_PRAYERS_PATH if the backend lives in a subfolder of a monorepo
// (e.g. 'divineconnect-backend/prayers').
const REPO_PRAYERS_PATH = process.env.GITHUB_PRAYERS_PATH || 'prayers';

function extractSection(body, heading) {
    const re = new RegExp(`##\\s*${heading}\\s*\\n+([\\s\\S]*?)(?=\\n##\\s|$)`, 'i');
    const match = body.match(re);
    return match ? match[1].trim() : '';
}

function slugify(text) {
    return text.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
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
        image: data.image || '',
        sanskrit: extractSection(content, 'Sanskrit'),
        transliteration: extractSection(content, 'Transliteration'),
        meaning: extractSection(content, 'Meaning'),
        benefits: extractSection(content, 'Benefits'),
    };
}

function loadAllPrayers() {
    if (!fs.existsSync(PRAYERS_DIR)) return [];
    return fs.readdirSync(PRAYERS_DIR)
        .filter((f) => f.endsWith('.md'))
        .map((f) => parsePrayerFile(path.join(PRAYERS_DIR, f)))
        .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
}

function buildMarkdown({ id, title, deity, frequency, slug, image, sanskrit, transliteration, meaning, benefits }) {
    return `---
id: ${id}
title: ${title}
deity: ${deity}
frequency: ${frequency}
slug: ${slug}
image: ${image || ''}
---
## Sanskrit

${sanskrit || ''}

## Transliteration

${transliteration || ''}

## Meaning

${meaning || ''}

## Benefits

${benefits || ''}
`;
}

// ─── GET /api/admin/prayers  — read straight off the deployed .md files.
// Reflects the site as it currently is; a just-committed change won't show
// here until Vercel finishes redeploying (that's expected — see the note
// returned in `deployNote`).
async function listPrayers(req, res) {
    try {
        const search = (req.query.search || '').trim().toLowerCase();
        let prayers = loadAllPrayers().map(({ sanskrit, transliteration, meaning, benefits, ...rest }) => rest);

        if (search) {
            prayers = prayers.filter(
                (p) => p.title.toLowerCase().includes(search) || p.deity.toLowerCase().includes(search)
            );
        }

        res.json({
            success: true,
            data: prayers,
            githubConfigured: github.isConfigured(),
        });
    } catch (err) {
        console.error('admin listPrayers error:', err);
        res.status(500).json({ success: false, message: 'Could not load prayers.' });
    }
}

// ─── GET /api/admin/prayers/:slug
async function getPrayer(req, res) {
    try {
        const prayers = loadAllPrayers();
        const prayer = prayers.find((p) => p.slug === req.params.slug);
        if (!prayer) return res.status(404).json({ success: false, message: 'Prayer not found.' });
        res.json({ success: true, data: prayer });
    } catch (err) {
        console.error('admin getPrayer error:', err);
        res.status(500).json({ success: false, message: 'Could not load prayer.' });
    }
}

// ─── POST /api/admin/prayers  — commits a new .md file straight to GitHub
async function createPrayer(req, res) {
    try {
        const { title, deity, frequency, image, sanskrit, transliteration, meaning, benefits } = req.body;
        if (!title?.trim() || !deity?.trim()) {
            return res.status(400).json({ success: false, message: 'Title and deity are required.' });
        }

        const existing = loadAllPrayers();
        const slug = (req.body.slug && req.body.slug.trim()) || slugify(title);
        if (existing.some((p) => p.slug === slug)) {
            return res.status(409).json({ success: false, message: 'A prayer with this slug already exists.' });
        }

        const nextId = existing.reduce((max, p) => Math.max(max, p.id || 0), 0) + 1;
        const markdown = buildMarkdown({
            id: nextId, title: title.trim(), deity: deity.trim(),
            frequency: frequency || 'Daily', slug, image, sanskrit, transliteration, meaning, benefits,
        });

        const result = await github.upsertFile(
            `${REPO_PRAYERS_PATH}/${slug}.md`,
            markdown,
            `Add prayer: ${title.trim()}`
        );

        res.status(201).json({
            success: true,
            message: 'Committed to GitHub — Vercel will redeploy automatically (usually 1–2 minutes).',
            commitUrl: result.commitUrl,
            data: { id: nextId, title, deity, frequency, slug, image },
        });
    } catch (err) {
        console.error('admin createPrayer error:', err);
        if (err.code === 'GITHUB_NOT_CONFIGURED') {
            return res.status(503).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: 'Could not publish prayer to GitHub.' });
    }
}

// ─── PUT /api/admin/prayers/:slug  — commits the updated .md file straight to GitHub
async function updatePrayer(req, res) {
    try {
        const { slug } = req.params;
        const existing = loadAllPrayers();
        const current = existing.find((p) => p.slug === slug);
        if (!current) return res.status(404).json({ success: false, message: 'Prayer not found.' });

        const updated = { ...current, ...req.body, id: current.id, slug: current.slug };
        const markdown = buildMarkdown(updated);

        const result = await github.upsertFile(
            `${REPO_PRAYERS_PATH}/${slug}.md`,
            markdown,
            `Update prayer: ${updated.title}`
        );

        res.json({
            success: true,
            message: 'Committed to GitHub — Vercel will redeploy automatically (usually 1–2 minutes).',
            commitUrl: result.commitUrl,
            data: updated,
        });
    } catch (err) {
        console.error('admin updatePrayer error:', err);
        if (err.code === 'GITHUB_NOT_CONFIGURED') {
            return res.status(503).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: 'Could not publish changes to GitHub.' });
    }
}

// ─── DELETE /api/admin/prayers/:slug  — commits the file removal straight to GitHub
async function deletePrayer(req, res) {
    try {
        const { slug } = req.params;
        const result = await github.deleteFile(
            `${REPO_PRAYERS_PATH}/${slug}.md`,
            `Remove prayer: ${slug}`
        );

        res.json({
            success: true,
            message: 'Removed via GitHub — Vercel will redeploy automatically (usually 1–2 minutes).',
            commitUrl: result.commitUrl,
        });
    } catch (err) {
        console.error('admin deletePrayer error:', err);
        if (err.code === 'GITHUB_NOT_CONFIGURED') {
            return res.status(503).json({ success: false, message: err.message });
        }
        if (err.code === 'NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Prayer file not found in the repository.' });
        }
        res.status(500).json({ success: false, message: 'Could not remove prayer via GitHub.' });
    }
}

module.exports = { listPrayers, getPrayer, createPrayer, updatePrayer, deletePrayer };
