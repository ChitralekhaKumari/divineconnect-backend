// Thin wrapper around the GitHub Contents API. Used to publish admin edits
// for file-based content (Prayers today; same pattern works for any future
// module that should stay git-backed instead of moving into Postgres).
//
// Why this instead of writing to disk: Vercel's serverless filesystem is
// read-only at runtime, so the backend can't edit its own repo files
// in-place. Committing straight to GitHub via its API sidesteps that
// entirely — and since Vercel is already wired to auto-deploy on push to
// this repo, a successful commit here *is* the deploy trigger. No webhook
// or deploy-hook wiring needed on our side.
const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const API_BASE = 'https://api.github.com';

function assertConfigured() {
    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        const err = new Error(
            'GitHub publishing isn\'t configured. Set GITHUB_TOKEN, GITHUB_OWNER and GITHUB_REPO in the backend environment.'
        );
        err.code = 'GITHUB_NOT_CONFIGURED';
        throw err;
    }
}

function headers() {
    return {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    };
}

function repoUrl(filePath) {
    return `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
}

// ─── Read a file's current content + sha (sha is required to update/delete it)
async function getFile(filePath) {
    assertConfigured();
    try {
        const { data } = await axios.get(repoUrl(filePath), {
            headers: headers(),
            params: { ref: GITHUB_BRANCH },
        });
        return {
            content: Buffer.from(data.content, 'base64').toString('utf8'),
            sha: data.sha,
        };
    } catch (err) {
        if (err.response?.status === 404) return null;
        throw err;
    }
}

// ─── Create or update a file — one commit, straight to the deploy branch
async function upsertFile(filePath, content, commitMessage) {
    assertConfigured();
    const existing = await getFile(filePath);

    const body = {
        message: commitMessage,
        content: Buffer.from(content, 'utf8').toString('base64'),
        branch: GITHUB_BRANCH,
    };
    if (existing) body.sha = existing.sha;

    const { data } = await axios.put(repoUrl(filePath), body, { headers: headers() });
    return { commitUrl: data.commit?.html_url, commitSha: data.commit?.sha };
}

// ─── Delete a file — one commit, straight to the deploy branch
async function deleteFile(filePath, commitMessage) {
    assertConfigured();
    const existing = await getFile(filePath);
    if (!existing) {
        const err = new Error('File not found in the repository.');
        err.code = 'NOT_FOUND';
        throw err;
    }

    const { data } = await axios.delete(repoUrl(filePath), {
        headers: headers(),
        data: { message: commitMessage, sha: existing.sha, branch: GITHUB_BRANCH },
    });
    return { commitUrl: data.commit?.html_url, commitSha: data.commit?.sha };
}

function isConfigured() {
    return Boolean(GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO);
}

module.exports = { getFile, upsertFile, deleteFile, isConfigured, GITHUB_BRANCH };
