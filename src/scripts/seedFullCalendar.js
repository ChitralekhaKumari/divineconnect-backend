
require('dotenv').config();
const pool = require('../config/db');

// Base festival dates for year 2026.
// For other years (2020-2050) we repeat the same month/day pattern
// so the calendar always shows something. You can correct exact dates later
// using a panchang provider API.
const BASE_FESTIVALS_2026 = [
  { name: 'Makar Sankranti',      month: 1,  day: 14, type: 'festival', holiday: true  },
  { name: 'Vasant Panchami',      month: 2,  day: 1,  type: 'festival', holiday: false },
  { name: 'Maha Shivaratri',      month: 2,  day: 15, type: 'festival', holiday: true  },
  { name: 'Holika Dahan',         month: 3,  day: 3,  type: 'festival', holiday: false },
  { name: 'Holi',                 month: 3,  day: 4,  type: 'festival', holiday: true  },
  { name: 'Chaitra Navratri',     month: 3,  day: 19, type: 'festival', holiday: false },
  { name: 'Ram Navami',           month: 3,  day: 27, type: 'festival', holiday: true  },
  { name: 'Hanuman Jayanti',      month: 4,  day: 2,  type: 'festival', holiday: true  },
  { name: 'Akshaya Tritiya',      month: 4,  day: 20, type: 'festival', holiday: false },
  { name: 'Buddha Purnima',       month: 5,  day: 1,  type: 'purnima',  holiday: true  },
  { name: 'Nirjala Ekadashi',     month: 6,  day: 12, type: 'ekadashi', holiday: false },
  { name: 'Guru Purnima',         month: 7,  day: 11, type: 'purnima',  holiday: false },
  { name: 'Nag Panchami',         month: 7,  day: 25, type: 'vrat',     holiday: false },
  { name: 'Raksha Bandhan',       month: 8,  day: 9,  type: 'festival', holiday: true  },
  { name: 'Krishna Janmashtami',  month: 8,  day: 22, type: 'festival', holiday: true  },
  { name: 'Ganesh Chaturthi',     month: 9,  day: 7,  type: 'festival', holiday: true  },
  { name: 'Pitru Paksha',         month: 9,  day: 20, type: 'vrat',     holiday: false },
  { name: 'Sharad Navratri',      month: 10, day: 8,  type: 'festival', holiday: false },
  { name: 'Durga Ashtami',        month: 10, day: 14, type: 'festival', holiday: false },
  { name: 'Dussehra',             month: 10, day: 17, type: 'festival', holiday: true  },
  { name: 'Karwa Chauth',         month: 10, day: 28, type: 'vrat',     holiday: false },
  { name: 'Dhanteras',            month: 10, day: 30, type: 'festival', holiday: false },
  { name: 'Diwali',               month: 11, day: 1,  type: 'festival', holiday: true  },
  { name: 'Govardhan Puja',       month: 11, day: 2,  type: 'festival', holiday: false },
  { name: 'Bhai Dooj',            month: 11, day: 3,  type: 'festival', holiday: false },
  { name: 'Chhath Puja',          month: 11, day: 5,  type: 'festival', holiday: false },
  { name: 'Dev Uthani Ekadashi',  month: 11, day: 10, type: 'ekadashi', holiday: false },
  { name: 'Tulsi Vivah',          month: 11, day: 14, type: 'festival', holiday: false },
  { name: 'Kartik Purnima',       month: 11, day: 15, type: 'purnima',  holiday: false },
  { name: 'Gita Jayanti',         month: 12, day: 8,  type: 'festival', holiday: false },
  { name: 'Vivah Panchami',       month: 12, day: 15, type: 'festival', holiday: false },
];

function pad(n) { return String(n).padStart(2, '0'); }

async function seedFullCalendar() {
  const client = await pool.connect();
  try {
    console.log('Seeding festivals for years 2020 to 2050...');
    let count = 0;

    for (let year = 2020; year <= 2050; year++) {
      for (const f of BASE_FESTIVALS_2026) {
        const date = `${year}-${pad(f.month)}-${pad(f.day)}`;
        await client.query(
          `INSERT INTO festivals (name, date, type, fasting, is_holiday, description)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [
            f.name,
            date,
            f.type,
            f.type === 'vrat' || f.type === 'ekadashi',
            f.holiday,
            `${f.name} celebration.`,
          ]
        );
        count++;
      }
    }

    console.log(`Done. Inserted up to ${count} festival rows (2020-2050).`);

    // ── sample panchang rows for current month, just so UI has real data ──
    console.log('Seeding sample panchang rows...');
    const today = new Date();
    const tithis = ['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima'];
    const nakshatras = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha'];

    for (let d = 1; d <= 30; d++) {
      const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(d)}`;
      await client.query(
        `INSERT INTO panchang
          (date, tithi, nakshatra, yoga, karana, sunrise, sunset, moonrise, moonset, rahu_kalam, gulika_kalam, yamaganda, abhijit_muhurat, brahma_muhurat)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (date) DO NOTHING`,
        [
          dateStr,
          tithis[d % tithis.length],
          nakshatras[d % nakshatras.length],
          'Siddhi',
          'Vishti',
          '6:02 AM', '6:48 PM', '8:14 PM', '7:40 AM',
          '12:00 PM - 1:30 PM',
          '9:00 AM - 10:30 AM',
          '7:30 AM - 9:00 AM',
          '11:51 AM',
          '4:38 AM - 5:26 AM',
        ]
      );
    }

    console.log('Sample panchang rows added.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedFullCalendar().catch(() => process.exit(1));
