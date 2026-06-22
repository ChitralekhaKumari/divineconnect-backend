// divineConnect/divineconnect_backend/src/scripts/seedCalendar.js
// REPLACE your existing file with this version
// Matches Google Calendar's "Holidays in India" 2026 list — all religions/categories
// Run with:  node src/scripts/seedCalendar.js

require('dotenv').config();
const pool = require('../config/db');

const festivals = [
  // ── National holidays ──────────────────────────────────────────────────
  { name: "New Year's Day",        date: '2026-01-01', deity: null,                fasting: false, tags: [], region: 'Pan-India', category: 'National', description: 'Celebration of the start of the Gregorian calendar year.' },
  { name: 'Republic Day',          date: '2026-01-26', deity: null,                fasting: false, tags: [], region: 'Pan-India', category: 'National', description: "Marks the day India's constitution came into effect in 1950." },
  { name: 'Gandhi Jayanti',        date: '2026-10-02', deity: null,                fasting: false, tags: [], region: 'Pan-India', category: 'National', description: 'Birthday of Mahatma Gandhi, observed as a national holiday.' },
  { name: 'Independence Day',      date: '2026-08-15', deity: null,                fasting: false, tags: [], region: 'Pan-India', category: 'National', description: "Marks India's independence from British rule in 1947." },
  { name: "Dr. Ambedkar's Birthday", date: '2026-04-14', deity: null,              fasting: false, tags: [], region: 'Pan-India', category: 'National', description: 'Birthday of Dr. B.R. Ambedkar, architect of the Indian constitution.' },

  // ── Hindu festivals — pan-India ────────────────────────────────────────
  { name: 'Makar Sankranti',     date: '2026-01-14', deity: 'Surya Dev',         fasting: false, tags: [],                          region: 'Pan-India', category: 'Hindu', description: "Harvest festival marking the Sun's transit into Capricorn." },
  { name: 'Vasant Panchami',     date: '2026-01-23', deity: 'Goddess Saraswati', fasting: false, tags: [],                          region: 'Pan-India', category: 'Hindu', description: 'Worship of Goddess Saraswati for knowledge and arts.' },
  { name: 'Maha Shivaratri',     date: '2026-02-15', deity: 'Lord Shiva',        fasting: true,  tags: ['Fasting Day'],             region: 'Pan-India', category: 'Hindu', description: 'The great night of Shiva. Devotees observe night-long vigil.' },
  { name: 'Holika Dahan',        date: '2026-03-03', deity: 'Lord Vishnu',       fasting: false, tags: [],                          region: 'Pan-India', category: 'Hindu', description: 'Bonfire night before Holi, symbolizing victory of good over evil.' },
  { name: 'Holi',                date: '2026-03-04', deity: 'Lord Krishna',      fasting: false, tags: [],                          region: 'Pan-India', category: 'Hindu', description: 'Festival of colors celebrating victory of good over evil.' },
  { name: 'Chaitra Navratri',    date: '2026-03-19', deity: 'Goddess Durga',     fasting: true,  tags: ['Fasting Day'],             region: 'Pan-India', category: 'Hindu', description: 'Nine nights of worship of Goddess Durga in spring.' },
  { name: 'Ram Navami',          date: '2026-03-27', deity: 'Lord Ram',          fasting: true,  tags: ['Fasting Day'],             region: 'Pan-India', category: 'Hindu', description: 'Birthday of Lord Rama, the 7th avatar of Lord Vishnu.' },
  { name: 'Hanuman Jayanti',     date: '2026-04-02', deity: 'Lord Hanuman',      fasting: true,  tags: ['Fasting Day'],             region: 'Pan-India', category: 'Hindu', description: 'Birthday of Lord Hanuman, symbol of strength and devotion.' },
  { name: 'Akshaya Tritiya',     date: '2026-04-19', deity: 'Lord Vishnu',       fasting: false, tags: [],                          region: 'Pan-India', category: 'Hindu', description: 'Most auspicious day for new beginnings and gold purchases.' },
  { name: 'Buddha Purnima',      date: '2026-05-12', deity: 'Gautama Buddha',    fasting: true,  tags: ['Purnima', 'Fasting Day'],  region: 'Pan-India', category: 'Buddhist', description: 'Full moon day celebrating the birth of Gautama Buddha.' },
  { name: 'Nirjala Ekadashi',    date: '2026-05-29', deity: 'Lord Vishnu',       fasting: true,  tags: ['Ekadashi', 'Fasting Day'], region: 'Pan-India', category: 'Hindu', description: 'Strictest Ekadashi fast — no food or water for a full day.' },
  { name: 'Guru Purnima',        date: '2026-07-11', deity: 'Sage Vyasa',        fasting: false, tags: ['Purnima'],                 region: 'Pan-India', category: 'Hindu', description: 'Day to honour spiritual and academic teachers.' },
  { name: 'Nag Panchami',        date: '2026-07-25', deity: 'Nag Devta',         fasting: true,  tags: ['Fasting Day'],             region: 'Pan-India', category: 'Hindu', description: 'Worship of serpent gods for protection and blessings.' },
  { name: 'Raksha Bandhan',      date: '2026-08-09', deity: 'Lord Vishnu',       fasting: false, tags: [],                          region: 'Pan-India', category: 'Hindu', description: 'Bond of protection between brothers and sisters.' },
  { name: 'Krishna Janmashtami', date: '2026-08-22', deity: 'Lord Krishna',      fasting: true,  tags: ['Fasting Day'],             region: 'Pan-India', category: 'Hindu', description: 'Birthday of Lord Krishna, 8th avatar of Vishnu.' },
  { name: 'Ganesh Chaturthi',    date: '2026-09-07', deity: 'Lord Ganesha',      fasting: false, tags: [],                          region: 'Pan-India', category: 'Hindu', description: "10-day festival celebrating Lord Ganesha's birth." },
  { name: 'Pitru Paksha',        date: '2026-09-12', deity: 'Ancestors',         fasting: false, tags: [],                          region: 'Pan-India', category: 'Hindu', description: 'Fortnight dedicated to paying homage to ancestors.' },
  { name: 'Sharad Navratri',     date: '2026-10-08', deity: 'Goddess Durga',     fasting: true,  tags: ['Fasting Day'],             region: 'Pan-India', category: 'Hindu', description: 'Nine nights of worship of Goddess Durga in autumn.' },
  { name: 'Durga Ashtami',       date: '2026-10-15', deity: 'Goddess Durga',     fasting: true,  tags: ['Fasting Day'],             region: 'Pan-India', category: 'Hindu', description: 'Worship of Goddess Durga on the eighth day of Navratri.' },
  { name: 'Dussehra',            date: '2026-10-17', deity: 'Lord Ram',          fasting: false, tags: [],                          region: 'Pan-India', category: 'Hindu', description: 'Victory of Rama over Ravana — good over evil.' },
  { name: 'Karwa Chauth',        date: '2026-10-26', deity: 'Lord Shiva',        fasting: true,  tags: ['Fasting Day'],             region: 'Pan-India', category: 'Hindu', description: "Women fast from sunrise to moonrise for husband's long life." },
  { name: 'Dhanteras',           date: '2026-11-05', deity: 'Goddess Lakshmi',   fasting: false, tags: [],                          region: 'Pan-India', category: 'Hindu', description: 'Worship of wealth and prosperity, start of Diwali festivities.' },
  { name: 'Diwali',              date: '2026-11-08', deity: 'Goddess Lakshmi',   fasting: false, tags: [],                          region: 'Pan-India', category: 'Hindu', description: "Festival of lights celebrating Lord Ram's return to Ayodhya." },
  { name: 'Govardhan Puja',      date: '2026-11-09', deity: 'Lord Krishna',      fasting: false, tags: [],                          region: 'Pan-India', category: 'Hindu', description: 'Worship of Govardhan hill, lifted by Lord Krishna.' },
  { name: 'Bhai Dooj',           date: '2026-11-10', deity: 'Yama Dev',          fasting: false, tags: [],                          region: 'Pan-India', category: 'Hindu', description: "Sisters pray for brothers' long life and well-being." },
  { name: 'Chhath Puja',         date: '2026-11-15', deity: 'Surya Dev',         fasting: true,  tags: ['Fasting Day'],             region: 'Bihar / UP / Jharkhand', category: 'Hindu', description: 'Worship of the Sun God for prosperity and well-being.' },
  { name: 'Dev Uthani Ekadashi', date: '2026-11-20', deity: 'Lord Vishnu',       fasting: true,  tags: ['Ekadashi', 'Fasting Day'], region: 'Pan-India', category: 'Hindu', description: 'Day Lord Vishnu wakes from his four-month cosmic sleep.' },
  { name: 'Tulsi Vivah',         date: '2026-11-21', deity: 'Lord Vishnu',       fasting: false, tags: [],                          region: 'Pan-India', category: 'Hindu', description: 'Ceremonial marriage of the Tulsi plant with Lord Vishnu.' },
  { name: 'Kartik Purnima',      date: '2026-11-24', deity: 'Lord Vishnu',       fasting: false, tags: ['Purnima'],                 region: 'Pan-India', category: 'Hindu', description: 'Holy full moon of Kartik month — sacred dip in river is done.' },
  { name: 'Gita Jayanti',        date: '2026-12-01', deity: 'Lord Krishna',      fasting: false, tags: [],                          region: 'Pan-India', category: 'Hindu', description: 'Anniversary of the day Lord Krishna delivered the Bhagavad Gita.' },
  { name: 'Vivah Panchami',      date: '2026-12-04', deity: 'Lord Ram',          fasting: false, tags: [],                          region: 'Pan-India', category: 'Hindu', description: 'Celebrates the divine wedding of Lord Ram and Goddess Sita.' },

  // ── Hindu festivals — major regional ───────────────────────────────────
  { name: 'Lohri',               date: '2026-01-13', deity: 'Agni Dev',          fasting: false, tags: [], region: 'Punjab / Haryana', category: 'Hindu', description: 'Bonfire festival marking the end of winter and harvest of rabi crops.' },
  { name: 'Pongal',              date: '2026-01-14', deity: 'Surya Dev',         fasting: false, tags: [], region: 'Tamil Nadu',        category: 'Hindu', description: 'Tamil harvest festival thanking the Sun God and cattle.' },
  { name: 'Magh Bihu',           date: '2026-01-14', deity: 'Nature',            fasting: false, tags: [], region: 'Assam',              category: 'Hindu', description: 'Assamese harvest festival celebrated with feasting and bonfires.' },
  { name: 'Gudi Padwa',          date: '2026-03-19', deity: 'Lord Brahma',       fasting: false, tags: [], region: 'Maharashtra',       category: 'Hindu', description: 'Marathi New Year marking the start of the spring harvest season.' },
  { name: 'Ugadi',               date: '2026-03-19', deity: 'Lord Brahma',       fasting: false, tags: [], region: 'Andhra Pradesh / Telangana / Karnataka', category: 'Hindu', description: 'Telugu and Kannada New Year celebrating new beginnings.' },
  { name: 'Baisakhi',            date: '2026-04-14', deity: 'Guru Nanak',        fasting: false, tags: [], region: 'Punjab',             category: 'Sikh',  description: 'Punjabi harvest festival and Sikh New Year celebration.' },
  { name: 'Bohag Bihu',          date: '2026-04-14', deity: 'Nature',            fasting: false, tags: [], region: 'Assam',              category: 'Hindu', description: 'Assamese New Year festival celebrating spring and harvest.' },
  { name: 'Rath Yatra',          date: '2026-06-26', deity: 'Lord Jagannath',    fasting: false, tags: [], region: 'Odisha',             category: 'Hindu', description: 'Chariot procession of Lord Jagannath through the streets of Puri.' },
  { name: 'Onam',                date: '2026-08-26', deity: 'King Mahabali',     fasting: false, tags: [], region: 'Kerala',             category: 'Hindu', description: 'Malayali harvest festival welcoming the legendary King Mahabali.' },
  { name: 'Durga Puja (Bengal)', date: '2026-10-15', deity: 'Goddess Durga',     fasting: false, tags: [], region: 'West Bengal',       category: 'Hindu', description: 'Grand Bengali celebration of Goddess Durga with elaborate pandals.' },
  { name: 'Kali Puja',           date: '2026-11-08', deity: 'Goddess Kali',      fasting: false, tags: [], region: 'West Bengal',       category: 'Hindu', description: 'Worship of Goddess Kali, celebrated alongside Diwali in Bengal.' },

  // ── Islamic holidays ────────────────────────────────────────────────────
  { name: 'Hazrat Ali Jayanti',     date: '2026-01-06', deity: null, fasting: false, tags: [], region: 'Pan-India', category: 'Islamic', description: 'Birthday of Hazrat Ali, cousin and son-in-law of Prophet Muhammad.' },
  { name: 'Shab-e-Barat',           date: '2026-02-02', deity: null, fasting: false, tags: [], region: 'Pan-India', category: 'Islamic', description: 'Night of forgiveness observed with prayer and reflection.' },
  { name: 'Ramzan / Ramadan begins',date: '2026-02-19', deity: null, fasting: true,  tags: ['Fasting Day'], region: 'Pan-India', category: 'Islamic', description: 'Start of the holy month of fasting for Muslims.' },
  { name: 'Shab-e-Qadr',            date: '2026-03-16', deity: null, fasting: false, tags: [], region: 'Pan-India', category: 'Islamic', description: "The Night of Power, marking the revelation of the Quran." },
  { name: 'Eid-ul-Fitr',            date: '2026-03-20', deity: null, fasting: false, tags: [], region: 'Pan-India', category: 'Islamic', description: 'Marks the end of the holy month of Ramadan.' },
  { name: 'Eid-ul-Adha (Bakrid)',   date: '2026-05-27', deity: null, fasting: false, tags: [], region: 'Pan-India', category: 'Islamic', description: 'Festival of Sacrifice, commemorating the devotion of Prophet Ibrahim.' },
  { name: 'Muharram / Ashura',      date: '2026-06-26', deity: null, fasting: false, tags: [], region: 'Pan-India', category: 'Islamic', description: "Day of mourning marking the martyrdom of Imam Hussain." },
  { name: 'Eid-e-Milad-un-Nabi',    date: '2026-08-25', deity: null, fasting: false, tags: [], region: 'Pan-India', category: 'Islamic', description: 'Celebrates the birthday of Prophet Muhammad.' },

  // ── Sikh holidays ───────────────────────────────────────────────────────
  { name: 'Guru Gobind Singh Jayanti', date: '2026-01-05', deity: 'Guru Gobind Singh', fasting: false, tags: [], region: 'Punjab', category: 'Sikh', description: 'Birthday of the tenth Sikh Guru, Guru Gobind Singh.' },
  { name: 'Guru Ravidas Jayanti',      date: '2026-02-01', deity: 'Guru Ravidas',      fasting: false, tags: [], region: 'Pan-India', category: 'Sikh', description: 'Birthday celebration of saint and poet Guru Ravidas.' },
  { name: 'Hola Mohalla',              date: '2026-03-05', deity: null,                fasting: false, tags: [], region: 'Punjab', category: 'Sikh', description: 'Sikh festival of martial arts and processions, a day after Holi.' },
  { name: 'Guru Arjan Dev Martyrdom',  date: '2026-06-16', deity: 'Guru Arjan Dev',    fasting: false, tags: [], region: 'Punjab', category: 'Sikh', description: 'Commemorates the martyrdom of the fifth Sikh Guru.' },
  { name: 'Guru Nanak Jayanti',        date: '2026-11-24', deity: 'Guru Nanak',        fasting: false, tags: [], region: 'Pan-India', category: 'Sikh', description: 'Birthday of Guru Nanak, founder of Sikhism.' },

  // ── Christian holidays ─────────────────────────────────────────────────
  { name: 'Ash Wednesday',  date: '2026-02-18', deity: null, fasting: true,  tags: ['Fasting Day'], region: 'Pan-India', category: 'Christian', description: 'Marks the beginning of Lent, a period of fasting and reflection.' },
  { name: 'Palm Sunday',    date: '2026-03-29', deity: null, fasting: false, tags: [], region: 'Pan-India', category: 'Christian', description: "Commemorates Jesus Christ's entry into Jerusalem." },
  { name: 'Maundy Thursday',date: '2026-04-02', deity: null, fasting: false, tags: [], region: 'Pan-India', category: 'Christian', description: "Commemorates the Last Supper of Jesus Christ." },
  { name: 'Good Friday',    date: '2026-04-03', deity: null, fasting: true,  tags: ['Fasting Day'], region: 'Pan-India', category: 'Christian', description: 'Commemorates the crucifixion of Jesus Christ.' },
  { name: 'Easter Sunday',  date: '2026-04-05', deity: null, fasting: false, tags: [], region: 'Pan-India', category: 'Christian', description: 'Celebrates the resurrection of Jesus Christ.' },
  { name: 'All Saints Day', date: '2026-11-01', deity: null, fasting: false, tags: [], region: 'Pan-India', category: 'Christian', description: 'Honors all Christian saints, known and unknown.' },
  { name: 'Christmas Eve',  date: '2026-12-24', deity: null, fasting: false, tags: [], region: 'Pan-India', category: 'Christian', description: 'The evening before Christmas Day, marked with church services.' },
  { name: 'Christmas Day',  date: '2026-12-25', deity: 'Jesus Christ', fasting: false, tags: [], region: 'Pan-India', category: 'Christian', description: 'Celebrates the birth of Jesus Christ.' },

  // ── Jain holidays ───────────────────────────────────────────────────────
  { name: 'Mahavir Jayanti', date: '2026-03-31', deity: 'Lord Mahavir', fasting: false, tags: [], region: 'Pan-India', category: 'Jain', description: 'Birthday of Lord Mahavir, the 24th Jain Tirthankara.' },
  { name: 'Paryushana begins', date: '2026-08-15', deity: null,         fasting: true,  tags: ['Fasting Day'], region: 'Pan-India', category: 'Jain', description: 'Most important annual Jain festival of fasting and forgiveness.' },
  { name: 'Mahavir Nirvana / Diwali', date: '2026-11-08', deity: 'Lord Mahavir', fasting: false, tags: [], region: 'Pan-India', category: 'Jain', description: 'Commemorates the spiritual liberation (Nirvana) of Lord Mahavir.' },

  // ── Buddhist holidays ───────────────────────────────────────────────────
  { name: 'Losar (Tibetan New Year)', date: '2026-02-18', deity: null, fasting: false, tags: [], region: 'Sikkim / Ladakh', category: 'Buddhist', description: 'Tibetan Buddhist New Year celebrated with prayers and festivities.' },
  { name: 'Ashadha Purnima (Dharma Day)', date: '2026-07-29', deity: 'Gautama Buddha', fasting: false, tags: ['Purnima'], region: 'Pan-India', category: 'Buddhist', description: "Commemorates Buddha's first sermon after enlightenment." },

  // ── Parsi / Zoroastrian ─────────────────────────────────────────────────
  { name: 'Parsi New Year (Navroz)', date: '2026-08-16', deity: null, fasting: false, tags: [], region: 'Mumbai / Gujarat', category: 'Parsi', description: 'Zoroastrian New Year celebrated by the Parsi community.' },
];

async function seedCalendar() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding festivals...');

    for (const f of festivals) {
      await client.query(
        `INSERT INTO festivals (name, date, deity, description, fasting, tags, region, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [f.name, f.date, f.deity, f.description, f.fasting, f.tags, f.region, f.category]
      );
      console.log(`  ✓ ${f.name} (${f.category})`);
    }

    console.log(`\n✅ Seeded ${festivals.length} festivals successfully`);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedCalendar().catch(() => process.exit(1));