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
