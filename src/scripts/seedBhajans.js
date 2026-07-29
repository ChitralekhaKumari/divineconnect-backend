// Run once (or re-run any time to reset demo data): node src/scripts/seedBhajans.js
//
// NOTE ON AUDIO FILES ───────────────────────────────────────────────────────
// The `audio_url` values below point to free, royalty-free DEMO/SAMPLE mp3
// tracks (SoundHelix) so that the player works out of the box with REAL
// playback the moment you seed the table. They are NOT the actual bhajan
// recordings (real devotional recordings are copyrighted and must be
// licensed properly). Before going to production:
//   1. Get properly licensed / royalty-free bhajan mp3 files.
//   2. Upload them somewhere public (Cloudinary, S3, your own /public folder,
//      YouTube-to-mp3 licensing service, etc).
//   3. Replace the `audio_url` field for each row with the real link.
// Everything else (progress bar, seek, queue, wishlist, lyrics, etc.) will
// keep working exactly the same — only the URL needs to change.
// ────────────────────────────────────────────────────────────────────────────
require('dotenv').config();
const pool = require('../config/db');

// FIX (audio bug): this list previously had only 6 entries, and with 12
// bhajans the array indices were reused (e.g. DEMO_AUDIO[0] was assigned to
// BOTH "Raghupati Raghav Raja Ram" (Rama) AND "Jai Ganesh Deva" (Ganesha)).
// That made unrelated deity cards play the exact same audio file. Every
// bhajan below now gets its OWN unique track (12 unique URLs for 12 rows),
// so no two cards — same deity or not — ever share a file.
const DEMO_AUDIO = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
];

function cover(text) {
  return `https://placehold.co/400x400/f59b24/ffffff?text=${encodeURIComponent(text)}&font=playfair-display`;
}

const bhajans = [
  {
    title: 'Raghupati Raghav Raja Ram',
    deity: 'Rama',
    singer: 'Traditional',
    duration_seconds: 324,
    language: 'Hindi',
    audio_url: DEMO_AUDIO[0],
    cover_image: cover('Ram'),
    lyrics_original: 'रघुपति राघव राजा राम\nपतित पावन सीता राम\nसीता राम, सीता राम\nभज प्यारे तू सीता राम',
    lyrics_transliteration: 'Raghupati Raghava Raja Rama\nPatita Pavana Sita Rama\nSita Rama, Sita Rama\nBhaja Pyare Tu Sita Rama',
    lyrics_meaning: 'O Lord Rama, descendant of Raghu, king of kings, purifier of the fallen — worship the beloved names of Sita and Rama with a devoted heart.',
  },
  {
    title: 'Shri Ramchandra Kripalu Bhajman',
    deity: 'Rama',
    singer: 'Anuradha Paudwal',
    duration_seconds: 402,
    language: 'Awadhi',
    audio_url: DEMO_AUDIO[1],
    cover_image: cover('Ram'),
    lyrics_original: 'श्री रामचन्द्र कृपालु भजु मन\nहरण भवभय दारुणं\nनवकंज लोचन कंज मुख कर\nकंज पद कंजारुणं',
    lyrics_transliteration: 'Shri Ramachandra Kripalu Bhaju Man\nHarana Bhava-Bhaya Darunam\nNavakanja Lochana Kanja Mukha Kara\nKanja Pada Kanjarunam',
    lyrics_meaning: 'O mind, worship the compassionate Lord Ramachandra, who removes the terrible fear of worldly existence, whose eyes, face, hands and feet are as beautiful as a lotus.',
  },
  {
    title: 'Achyutam Keshavam',
    deity: 'Krishna',
    singer: 'Traditional',
    duration_seconds: 268,
    language: 'Sanskrit',
    audio_url: DEMO_AUDIO[2],
    cover_image: cover('Krishna'),
    lyrics_original: 'अच्युतम् केशवम् राम नारायणम्\nकृष्ण दामोदरम वासुदेवं हरिम्\nश्रीधरम् माधवम् गोपिका वल्लभम्\nजानकी नायकम् रामचन्द्रं भजे',
    lyrics_transliteration: 'Achyutam Keshavam Rama Narayanam\nKrishna Damodaram Vasudevam Harim\nShridharam Madhavam Gopika Vallabham\nJanaki Nayakam Ramachandram Bhaje',
    lyrics_meaning: 'I worship the imperishable Lord under all His names — Keshava, Rama, Narayana, Krishna, Damodara, Vasudeva, Hari — the beloved of the gopis and the lord of Janaki.',
  },
  {
    title: 'Hare Krishna Hare Rama',
    deity: 'Krishna',
    singer: 'Traditional',
    duration_seconds: 355,
    language: 'Sanskrit',
    audio_url: DEMO_AUDIO[3],
    cover_image: cover('Krishna'),
    lyrics_original: 'हरे कृष्ण हरे कृष्ण\nकृष्ण कृष्ण हरे हरे\nहरे राम हरे राम\nराम राम हरे हरे',
    lyrics_transliteration: 'Hare Krishna Hare Krishna\nKrishna Krishna Hare Hare\nHare Rama Hare Rama\nRama Rama Hare Hare',
    lyrics_meaning: 'The Maha Mantra — a simple, repeated call to the divine names of Krishna and Rama, said to purify the mind and awaken devotion.',
  },
  {
    title: 'Om Jai Shiv Omkara',
    deity: 'Shiv',
    singer: 'Hariharan',
    duration_seconds: 389,
    language: 'Hindi',
    audio_url: DEMO_AUDIO[4],
    cover_image: cover('Shiv'),
    lyrics_original: 'ॐ जय शिव ओंकारा\nस्वामी जय शिव ओंकारा\nब्रह्मा विष्णु सदाशिव\nअर्धांगी धारा',
    lyrics_transliteration: 'Om Jai Shiv Omkara\nSwami Jai Shiv Omkara\nBrahma Vishnu Sadashiv\nArdhangi Dhara',
    lyrics_meaning: 'Victory to Lord Shiva, the eternal sound of Om, who embodies Brahma, Vishnu and Sadashiv, and who carries the sacred Ganga upon his head.',
  },
  {
    title: 'Bhole Bhandari',
    deity: 'Shiv',
    singer: 'Traditional',
    duration_seconds: 297,
    language: 'Hindi',
    audio_url: DEMO_AUDIO[5],
    cover_image: cover('Shiv'),
    lyrics_original: 'भोले भंडारी शिव शंकर\nहर हर महादेव\nडमरू वाले भोलेनाथ\nहर हर महादेव',
    lyrics_transliteration: 'Bhole Bhandari Shiv Shankar\nHar Har Mahadev\nDamru Wale Bholenath\nHar Har Mahadev',
    lyrics_meaning: 'A joyful call to Lord Shiva, the innocent-hearted treasurer of grace, the one who carries the damru — Har Har Mahadev, victory to the great god.',
  },
  {
    title: 'Jai Ganesh Deva',
    deity: 'Ganesha',
    singer: 'Traditional',
    duration_seconds: 276,
    language: 'Hindi',
    audio_url: DEMO_AUDIO[6],
    cover_image: cover('Ganesh'),
    lyrics_original: 'जय गणेश जय गणेश\nजय गणेश देवा\nमाता जाकी पार्वती\nपिता महादेवा',
    lyrics_transliteration: 'Jai Ganesh Jai Ganesh\nJai Ganesh Deva\nMata Jaki Parvati\nPita Mahadeva',
    lyrics_meaning: 'Victory to Lord Ganesha, son of Mother Parvati and Father Mahadeva, remover of obstacles, worshipped first among all the gods.',
  },
  {
    title: 'Om Jai Jagdish Hare',
    deity: 'Vishnu',
    singer: 'Anuradha Paudwal',
    duration_seconds: 338,
    language: 'Hindi',
    audio_url: DEMO_AUDIO[7],
    cover_image: cover('Vishnu'),
    lyrics_original: 'ॐ जय जगदीश हरे\nस्वामी जय जगदीश हरे\nभक्त जनों के संकट\nक्षण में दूर करे',
    lyrics_transliteration: 'Om Jai Jagdish Hare\nSwami Jai Jagdish Hare\nBhakt Janon Ke Sankat\nKshan Mein Door Kare',
    lyrics_meaning: 'Victory to the Lord of the universe, who removes the troubles of His devotees in an instant. A beloved evening aarti sung in nearly every Hindu home.',
  },
  {
    title: 'Jai Ambe Gauri',
    deity: 'Durga',
    singer: 'Traditional',
    duration_seconds: 312,
    language: 'Hindi',
    audio_url: DEMO_AUDIO[8],
    cover_image: cover('Durga'),
    lyrics_original: 'जय अम्बे गौरी\nमैया जय श्यामा गौरी\nतुमको निशिदिन ध्यावत\nहर ब्रह्मा शिवरी',
    lyrics_transliteration: 'Jai Ambe Gauri\nMaiya Jai Shyama Gauri\nTumko Nishidin Dhyavat\nHar Brahma Shivari',
    lyrics_meaning: 'Victory to Mother Ambe Gauri, worshipped day and night even by Hari, Brahma and Shiva — the aarti sung to Goddess Durga.',
  },
  {
    title: 'Hanuman Chalisa (Opening)',
    deity: 'Hanuman',
    singer: 'Hariharan',
    duration_seconds: 512,
    language: 'Awadhi',
    audio_url: DEMO_AUDIO[9],
    cover_image: cover('Hanuman'),
    lyrics_original: 'श्रीगुरु चरन सरोज रज\nनिज मन मुकुरु सुधारि\nबरनउं रघुबर बिमल जसु\nजो दायकु फल चारि',
    lyrics_transliteration: 'Shri Guru Charan Saroj Raj\nNij Man Mukuru Sudhari\nBaranau Raghubar Bimal Jasu\nJo Dayaku Phal Chari',
    lyrics_meaning: 'Cleansing the mirror of my mind with the dust of my Guru\'s lotus feet, I describe the pure glory of Lord Rama, which grants the four fruits of life.',
  },
  {
    title: 'Sankat Mochan Naam Tiharo',
    deity: 'Hanuman',
    singer: 'Traditional',
    duration_seconds: 245,
    language: 'Hindi',
    audio_url: DEMO_AUDIO[10],
    cover_image: cover('Hanuman'),
    lyrics_original: 'संकट मोचन नाम तिहारो\nजो जपे सो अजर अमर हो जावे',
    lyrics_transliteration: 'Sankat Mochan Naam Tiharo\nJo Jape So Ajar Amar Ho Jave',
    lyrics_meaning: 'Your very name, O Hanuman, destroys all obstacles. Whoever chants it becomes free of decay and fear.',
  },
  {
    title: 'Sai Baba Aarti - Jai Sainath',
    deity: 'Sai Baba',
    singer: 'Traditional',
    duration_seconds: 298,
    language: 'Marathi',
    audio_url: DEMO_AUDIO[11],
    cover_image: cover('Sai Baba'),
    lyrics_original: 'आरती साईबाबा\nसौख्यदातार जीवा\nचरणरजतलिका उभा भावें दे धरूं',
    lyrics_transliteration: 'Aarti Sai Baba\nSaukhyadatar Jeeva\nCharana Rajatalika Ubha Bhaven De Dharu',
    lyrics_meaning: 'A gentle aarti offered to Sai Baba, giver of peace and comfort to all beings, as devotees stand before his lotus feet with devotion.',
  },
];

async function run() {
  try {
    console.log('Seeding bhajans…');
    await pool.query('DELETE FROM bhajans');
    for (const b of bhajans) {
      await pool.query(
        `INSERT INTO bhajans
          (title, deity, singer, duration_seconds, language, audio_url, cover_image,
           lyrics_original, lyrics_transliteration, lyrics_meaning, play_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, floor(random() * 400)::int)`,
        [b.title, b.deity, b.singer, b.duration_seconds, b.language, b.audio_url, b.cover_image,
         b.lyrics_original, b.lyrics_transliteration, b.lyrics_meaning]
      );
    }
    console.log(`✅ Done. Seeded ${bhajans.length} bhajans.`);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
