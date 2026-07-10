# DivineConnect Backend

Node.js + Express + PostgreSQL REST API for the DivineConnect temple platform.

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally (or a cloud DB)

### 2. Install dependencies
```bash
cd backend
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env and fill in your PostgreSQL credentials
```

### 4. Create the database
```sql
-- In psql or pgAdmin:
CREATE DATABASE divineconnect;
```

### 5. Initialise schema + seed data
```bash
npm run db:setup
# Runs initDb.js (creates tables) then seedTemples.js (inserts data)
```

### 6. Start the server
```bash
npm run dev      # with nodemon (auto-restart)
npm start        # production
```

Server starts at **http://localhost:5000**

---

## Prayers Module

Prayer content (Sanskrit text, transliteration, meaning, benefits) is static —
it never changes — so it is **not** stored in Postgres. Instead, every prayer
lives in its own Markdown file inside `/prayers` at the project root:

```
prayers/
├── gayatri-mantra.md
├── hanuman-chalisa.md
├── om-namah-shivaya.md
└── ... (one .md file per prayer)
```

Each file has YAML frontmatter plus four sections:

```markdown
---
id: 1
title: Gayatri Mantra
deity: Savitri
frequency: Daily
slug: gayatri-mantra
---
## Sanskrit

ॐ भूर्भुवः स्वः...

## Transliteration

Om Bhur Bhuvah Swah...

## Meaning

...

## Benefits

...
```

`src/controllers/prayerController.js` reads and parses these files on demand
(cached in memory after the first read) and serves them through the same API
shape the frontend already expects:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/prayers` | All prayers, optional `?category=<deity>` filter |
| GET | `/api/prayers/categories` | Distinct list of deities |
| GET | `/api/prayers/:slug` | Single prayer by slug or numeric id |

**To add a new prayer:** drop a new `.md` file into `/prayers` following the
format above and give it the next `id`. No database migration needed.

**To edit a prayer:** just edit its `.md` file directly — no SQL needed.

The old `src/scripts/seedPrayers.js` script and the `prayers` Postgres table
are deprecated and no longer used by the API.

---

## Scriptures Module

Scripture content (Sanskrit text, transliteration, English/Hindi translation)
is static — it never changes — so like Prayers, it is **not** stored in
Postgres. Instead, every scripture lives in its own Markdown file inside
`/scriptures` at the project root:

```
scriptures/
├── bhagavad-gita.md
├── ramayana.md
├── mahabharata.md
├── upanishads.md
├── rigveda.md
└── ... (one .md file per scripture, however large — e.g. all ~23,000
        Ramayana verses live in the single ramayana.md file)
```

Each file has YAML frontmatter (id, slug, title, description, category,
emoji, color, language, meta_labels, source, display_order) followed by
`## Chapter N: Title` sections, each containing `### Verse N` blocks with
`**Sanskrit:**` / `**Transliteration:**` / `**English:**` / `**Hindi:**` /
`**Summary:**` fields:

```markdown
---
id: 1
slug: "bhagavad-gita"
title: "Bhagavad Gita"
description: "..."
category: "Smriti"
emoji: "📖"
color: "#e8f0fe"
language: "Sanskrit"
meta_labels: ["18 Chapters", "Sanskrit"]
source: "..."
display_order: 1
---
## Chapter 1: Arjuna Vishada Yoga

### Verse 1
**Sanskrit:** ...
**Transliteration:** ...
**English:** ...
**Hindi:** ...
```

A scripture with no chapters yet (verses "pending", e.g. most Puranas) is
just the frontmatter block — it still shows up in the Scriptures list with
an empty chapter list.

`src/utils/scriptureLoader.js` reads and parses these files on demand
(cached in memory after the first read), and `src/controllers/scriptureController.js`
serves them through the same API shape the frontend already expects.

**To add or edit a scripture:** create/edit its `.md` file in `/scriptures`
directly — no SQL, no migration needed.

**Refreshing Bhagavad Gita / Ramayana content:**
- `node fetch-gita-to-md.js` — pulls the full 18-chapter, ~700-verse Gita
  (Sanskrit, transliteration, English, Hindi) from RapidAPI and writes
  `scriptures/bhagavad-gita.md`. Requires `RAPIDAPI_KEY` in `.env` and
  network access to `*.rapidapi.com`.
- `node ramayana-json-to-md.js /path/to/Valmiki_Ramayan_Shlokas.json` —
  converts the Valmiki_Ramayan_Dataset JSON (AshuVj, GitHub, MIT license)
  into `scriptures/ramayana.md`.

**Bookmarks / Favorites / Reading Progress:** these are the only scripture
features that still touch Postgres, since they're user-specific, not
content. They're keyed by `(scriptureSlug, chapterNumber, verseNumber)` /
`scriptureSlug` instead of a foreign key into a `verses` table (which no
longer exists). Run the one-time migration to set up these tables:
```bash
node src/scripts/migrateScripturesToMd.js
```
This also drops the old `scriptures` / `chapters` / `verses` tables and the
old id-keyed `bookmarks` / `favorites` / `reading_progress` tables.

The old `import-gita.js`, `import-gita-hindi.js`, `import-ramayana.js`, and
`src/scripts/seedScriptures.js` are deprecated and no longer used by the API
— kept only for reference.

---

## Using Kaggle Data (optional)

1. Download a temple dataset from Kaggle  
   e.g. https://www.kaggle.com/datasets/sahil101/india-temples  
   or any CSV with columns: Temple Name, State, City, Main Deity, Timings, etc.

2. Place the CSV file at:
   ```
   backend/data/temples.csv
   ```

3. Re-run the seed:
   ```bash
   npm run db:seed
   ```

The seed script auto-detects the CSV. If columns in your CSV differ from the defaults,  
edit the `csvRowToTemple()` mapping in `src/scripts/seedTemples.js`.

If no CSV is present, 15+ famous Indian temples are seeded automatically.

---

## API Reference

### Base URL
```
http://localhost:5000/api
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/temples` | Paginated list with search & filters |
| GET | `/temples/:id` | Full detail for one temple |
| GET | `/temples/categories` | Category breakdown with counts |
| GET | `/temples/states` | All states with temple counts |
| GET | `/temples/featured` | LIVE + FEATURED temples (for hero strip) |
| GET | `/health` | Server health check |

### GET /api/temples — Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 12 | Items per page (max 50) |
| `search` | string | – | Full-text search on name, deity, city, state |
| `category` | string | – | `Shiva` \| `Vishnu` \| `Devi` \| `Other` |
| `tag` | string | – | `LIVE` \| `POPULAR` \| `FEATURED` \| `NEW` |
| `state` | string | – | Filter by state name (partial match) |
| `sort` | string | `id` | `rating` \| `reviews` \| `name` \| `id` |

#### Example Response
```json
{
  "success": true,
  "data": [ { "id": 1, "name": "Kashi Vishwanath", ... } ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 12,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js               # PostgreSQL pool
│   ├── controllers/
│   │   └── templeController.js # Route handlers
│   ├── middleware/
│   │   └── errorHandler.js     # 404 + error middleware
│   ├── routes/
│   │   └── temples.js          # Express router
│   ├── scripts/
│   │   ├── initDb.js           # Create tables
│   │   └── seedTemples.js      # Seed data (Kaggle CSV or hardcoded)
│   └── server.js               # Express app entry point
├── data/
│   └── temples.csv             # (Place your Kaggle CSV here)
├── .env.example
└── package.json
```

---

## Database Schema

```sql
temples (
  id, name, alternate_name, deity, other_deities[],
  category, location_city, location_state, full_address,
  pincode, latitude, longitude, nearest_railway, nearest_airport,
  timings_general, timings_morning_aarti, timings_evening_aarti, timings_closed_on,
  entry_fee, dress_code, special_darshan,
  famous_for, history, best_time_visit, festivals[],
  contact_phone, website, image_url, tag, rating, reviews,
  is_active, created_at, updated_at
)
```
