/**
 * Backfills placeholder ("dummy") data for any temple missing the sidebar
 * fields, so every section shows up while the app is running — even
 * before you've entered real content. Only fills fields that are
 * currently NULL / empty; anything you've already set is left untouched.
 *
 * Run:
 *   node src/scripts/seedTempleTmsDummyData.js
 */
require('dotenv').config();
const pool = require('../config/db');

function isEmpty(v) {
  if (v === null || v === undefined) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'string') return v.trim() === '';
  return false;
}

function buildDummy(t) {
  const place = [t.location_city, t.location_state].filter(Boolean).join(', ') || 'its region';
  return {
    famous_for: isEmpty(t.famous_for) ? `${t.name} is one of the most revered ${t.deity || 'Hindu'} temples in ${place}, drawing devotees for its spiritual atmosphere and traditional architecture.` : t.famous_for,
    history: isEmpty(t.history) ? `The temple is believed to date back several centuries and holds deep historical and religious significance in ${place}. Local legends and inscriptions connect it to the region's rich spiritual heritage.` : t.history,
    temple_activities: isEmpty(t.temple_activities) ? [
      { name: 'Morning Suprabhatam', timing: '5:30 AM', description: 'Ceremonial wake-up hymns for the deity.' },
      { name: 'Evening Aarti', timing: '7:00 PM', description: 'Daily lamp-waving ritual open to all devotees.' },
    ] : t.temple_activities,
    sevas: isEmpty(t.sevas) ? [
      { name: 'Archana', timing: '6:00 AM – 12:00 PM', price: '₹100', description: 'Chanting of the deity\'s names with flowers.' },
      { name: 'Abhishekam', timing: '6:00 AM', price: '₹500', description: 'Sacred bathing ritual with milk, honey and holy water.' },
    ] : t.sevas,
    darshan_types: isEmpty(t.darshan_types) ? [
      { name: 'Free Darshan', price: 'Free', duration: '~1 hr wait', description: 'General queue line darshan.' },
      { name: 'Special Darshan', price: '₹300', duration: '~15 min wait', description: 'Faster-moving separate queue.' },
    ] : t.darshan_types,
    accommodation_info: isEmpty(t.accommodation_info) ? `Devotee guest houses (Yatri Nivas) are available near the temple with AC and non-AC rooms. Advance online booking is recommended during festival season.` : t.accommodation_info,
    donation_info: isEmpty(t.donation_info) ? `Donations can be made at the temple's Donation counter or online. 80G tax-exemption receipts are issued on request.` : t.donation_info,
    annadanam_info: isEmpty(t.annadanam_info) ? `The temple runs a daily Annadanam (free meal) program for devotees. Contributions towards Annadanam can be made at the counter or online.` : t.annadanam_info,
    hundi_info: isEmpty(t.hundi_info) ? `Offerings placed in the temple Hundi are counted under the supervision of temple officials and used for temple maintenance and charitable activities.` : t.hundi_info,
    guidelines: isEmpty(t.guidelines) ? [
      'Mobile phones and cameras are not allowed inside the sanctum.',
      'Footwear must be removed before entering the temple premises.',
      'Follow the queue line for darshan; avoid pushing or overtaking.',
      'Modest, traditional attire is recommended.',
    ] : t.guidelines,
    adopted_temples: isEmpty(t.adopted_temples) ? [
      { name: `Sri Anjaneya Swamy Temple`, location: place },
    ] : t.adopted_temples,
    temple_members: isEmpty(t.temple_members) ? [
      { name: 'Executive Officer', designation: 'Temple Administration' },
      { name: 'Chief Priest', designation: 'Head Archaka' },
    ] : t.temple_members,
    rituals: isEmpty(t.rituals) ? [
      { name: 'Nitya Pooja', frequency: 'Daily', description: 'Routine worship performed by temple priests.' },
      { name: 'Brahmotsavam', frequency: 'Annual', description: 'Grand annual festival with processions and special rites.' },
    ] : t.rituals,
    muttams_peetams: isEmpty(t.muttams_peetams) ? `The temple maintains ties with regional Muttams/Peetams that guide its religious and Vedic practices.` : t.muttams_peetams,
    transport_info: isEmpty(t.transport_info) ? `Well connected by road with regular bus services; auto-rickshaws and taxis are available from the nearest railway station.` : t.transport_info,
    distance_info: isEmpty(t.distance_info) ? `Approximately 5 km from the city center of ${t.location_city || 'the nearest town'}.` : t.distance_info,
    how_to_reach: isEmpty(t.how_to_reach) ? `The temple is easily reachable by road, rail, and (where applicable) air, with local transport available from the nearest station/airport.` : t.how_to_reach,
    temple_trust: isEmpty(t.temple_trust) ? `${t.name} Devasthanam Trust` : t.temple_trust,
    gallery_images: isEmpty(t.gallery_images) ? [] : t.gallery_images, // left empty on purpose — real photos only
    online_services: (t.online_services && Object.keys(t.online_services).length) ? t.online_services : {},
  };
}

async function run() {
  try {
    const { rows: temples } = await pool.query(`SELECT * FROM temples WHERE is_active = TRUE`);
    console.log(`Found ${temples.length} temples. Backfilling missing sidebar fields...`);

    for (const t of temples) {
      const d = buildDummy(t);
      await pool.query(
        `UPDATE temples SET
           famous_for          = $1,
           history              = $2,
           temple_activities    = $3,
           sevas                = $4,
           darshan_types        = $5,
           accommodation_info   = $6,
           donation_info        = $7,
           annadanam_info       = $8,
           hundi_info           = $9,
           guidelines           = $10,
           adopted_temples      = $11,
           temple_members       = $12,
           rituals              = $13,
           muttams_peetams      = $14,
           transport_info       = $15,
           distance_info        = $16,
           how_to_reach         = $17,
           temple_trust         = $18,
           gallery_images       = $19,
           online_services      = $20,
           updated_at           = NOW()
         WHERE id = $21`,
        [
          d.famous_for, d.history, JSON.stringify(d.temple_activities), JSON.stringify(d.sevas),
          JSON.stringify(d.darshan_types), d.accommodation_info, d.donation_info, d.annadanam_info,
          d.hundi_info, d.guidelines, JSON.stringify(d.adopted_temples), JSON.stringify(d.temple_members),
          JSON.stringify(d.rituals), d.muttams_peetams, d.transport_info, d.distance_info,
          d.how_to_reach, d.temple_trust, d.gallery_images, JSON.stringify(d.online_services),
          t.id,
        ]
      );
      console.log(`  ✓ ${t.name}`);
    }

    console.log('✅ All temples backfilled.');
  } catch (err) {
    console.error('❌ Backfill failed:', err.message);
  } finally {
    await pool.end();
  }
}

run();
