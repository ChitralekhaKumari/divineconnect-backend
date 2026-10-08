/**
 * Fill in the "sidebar" fields (Sevas, Darshan types, Accommodation,
 * Donation, Gallery, Online Services, How to Reach, Trust) for one temple.
 *
 * This is the file you edit whenever you want to add real detail data for
 * a temple — no SQL needed. Set TEMPLE_ID to the id of the temple (from
 * `SELECT id, name FROM temples;`) and fill in whichever fields you have.
 * Leave a field as-is (empty array / null) to skip it — the frontend
 * sidebar tab simply won't show if there's nothing to display.
 *
 * Run:
 *   node src/scripts/updateTempleSidebarDetails.js
 */
require('dotenv').config();
const pool = require('../config/db');

// ── 1. Which temple? ────────────────────────────────────────────────────
const TEMPLE_ID = 1; // ← change this to the temple you're editing

// ── 2. Fill in whatever you have ────────────────────────────────────────
const DATA = {
  sevas: [
    { name: 'Archana',        timing: '6:00 AM – 12:00 PM', price: '₹100', description: 'Chanting of 108 names of the deity with flowers.' },
    { name: 'Abhishekam',     timing: '6:00 AM',             price: '₹500', description: 'Sacred bathing ritual of the deity with milk, honey and holy water.' },
    { name: 'Kalyanotsavam',  timing: 'By appointment',      price: '₹1,000', description: 'Ceremonial celestial wedding of the deity.' },
  ],
  darshan_types: [
    { name: 'Free Darshan',    price: 'Free',   duration: '~1 hr wait', description: 'General queue line darshan.' },
    { name: 'Special Darshan', price: '₹300',   duration: '~15 min wait', description: 'Faster-moving separate queue.' },
  ],
  accommodation_info:
    'The temple trust operates guest houses (Yatri Nivas) near the main gate with AC and non-AC rooms. Advance online booking is recommended during festival season.',
  donation_info:
    'Donations can be made at the Hundi counter or online. Receipts eligible for 80G tax exemption are issued on request at the donation counter.',
  how_to_reach:
    'Well connected by road from the nearest major city; APSRTC buses run frequently. Auto-rickshaws and taxis are available from the railway station.',
  gallery_images: [
    // 'https://example.com/temple-photo-1.jpg',
    // 'https://example.com/temple-photo-2.jpg',
  ],
  temple_trust: '',
  online_services: {
    // darshan_booking_url: 'https://example.com/darshan',
    // seva_booking_url: 'https://example.com/seva',
    // donation_url: 'https://example.com/donate',
    // accommodation_url: 'https://example.com/accommodation',
  },
};

async function run() {
  try {
    const result = await pool.query(
      `UPDATE temples SET
         sevas               = $1,
         darshan_types       = $2,
         accommodation_info  = $3,
         donation_info       = $4,
         how_to_reach        = $5,
         gallery_images      = $6,
         temple_trust        = NULLIF($7, ''),
         online_services     = $8,
         updated_at          = NOW()
       WHERE id = $9
       RETURNING id, name`,
      [
        JSON.stringify(DATA.sevas),
        JSON.stringify(DATA.darshan_types),
        DATA.accommodation_info,
        DATA.donation_info,
        DATA.how_to_reach,
        DATA.gallery_images,
        DATA.temple_trust,
        JSON.stringify(DATA.online_services),
        TEMPLE_ID,
      ]
    );

    if (result.rows.length === 0) {
      console.log(`❌ No temple found with id ${TEMPLE_ID}`);
    } else {
      console.log(`✅ Updated sidebar details for "${result.rows[0].name}" (id ${result.rows[0].id})`);
    }
  } catch (err) {
    console.error('❌ Update failed:', err.message);
  } finally {
    await pool.end();
  }
}

run();
