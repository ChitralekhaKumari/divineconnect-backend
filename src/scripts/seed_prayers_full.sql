-- ============================================================
-- DivineConnect Prayers Seed - Full Mantra Collection
-- Adds 26 new mantras to the existing 6 already seeded
-- Safe to run multiple times (UPSERT on title)
-- ============================================================

INSERT INTO prayers (title, deity, frequency, sanskrit, transliteration, meaning, benefits) VALUES

-- ── GANESHA ─────────────────────────────────────────────────────────────────
(
  'Ganapati Atharvashirsha', 'Ganesha', 'Wednesday',
  'ॐ नमस्ते गणपतये। त्वमेव प्रत्यक्षं तत्त्वमसि। त्वमेव केवलं कर्तासि। त्वमेव केवलं धर्तासि। त्वमेव केवलं हर्तासि। त्वमेव सर्वं खल्विदं ब्रह्मासि। त्वं साक्षादात्मासि नित्यम्॥',
  'Om Namaste Ganapataye. Tvameva Pratyaksham Tattvamasi. Tvameva Kevalam Kartasi. Tvameva Kevalam Dhartasi. Tvameva Kevalam Hartasi. Tvameva Sarvam Khalvidam Brahmasi. Tvam Sakshadatmasi Nityam.',
  'Salutations to you, O Ganapati. You are indeed the visible ultimate reality. You alone are the creator, sustainer and destroyer of all. You alone are all this Brahman. You are the eternal Self, directly perceived.',
  'The Ganapati Atharvashirsha is an Upanishad dedicated entirely to Lord Ganesha. Recited on Wednesdays and during Ganesh Chaturthi, it bestows wisdom, success in all undertakings and removal of all obstacles from one''s life path.'
),
(
  'Vakratunda Mahakaya Mantra', 'Ganesha', 'Daily',
  'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥',
  'Vakratunda Mahakaya Suryakoti Samaprabha, Nirvighnam Kuru Me Deva Sarva-Karyeshu Sarvada',
  'O Lord with the curved trunk and the massive body, whose brilliance equals a crore of suns — make all my endeavours free from obstacles, always.',
  'Recited before starting any auspicious task, journey, exam or new venture. This short but potent shloka invokes Lord Ganesha''s blessing to clear the path ahead of all hurdles.'
),
(
  'Om Gan Ganapataye Namah', 'Ganesha', 'Daily',
  'ॐ गं गणपतये नमः।',
  'Om Gam Ganapataye Namah',
  'Salutations to Lord Ganapati, the seed (Gam) of whose being is invoked in this bija mantra.',
  'The bija (seed) mantra of Ganesha. Chanting it 108 times daily, especially on Wednesdays, is said to remove mental blocks, bless new beginnings and awaken intelligence. It is the shortest and most powerful Ganesha mantra.'
),

-- ── SHIVA ────────────────────────────────────────────────────────────────────
(
  'Om Namah Shivaya', 'Shiva', 'Daily',
  'ॐ नमः शिवाय।',
  'Om Namah Shivaya',
  'Salutations to Lord Shiva — the five-syllable Panchakshara mantra representing the five elements: earth (Na), water (Ma), fire (Shi), air (Va) and space (Ya).',
  'Considered the highest Shiva mantra (Maha Mantra), its continuous repetition calms the mind, purifies the soul and leads the devotee toward self-realisation. It is the heartbeat of Shaivism.'
),
(
  'Shiva Tandava Stotram', 'Shiva', 'Monday',
  'जटाटवीगलज्जलप्रवाहपावितस्थले गलेऽवलम्ब्य लम्बितां भुजङ्गतुङ्गमालिकाम्। डमड्डमड्डमड्डमन्निनादवड्डमर्वयं चकार चण्डताण्डवं तनोतु नः शिवः शिवम्॥',
  'Jatatavigalajjala Pravahapavitasthale Galeavalambya Lambitam Bhujangalunga Malikam, Damaddamaddamaddaman Ninadavadamarvayam Chakara Chandatandavam Tanotuh Nah Shivah Shivam',
  'May Shiva, who performed the fierce Tandava dance, his matted locks dripping sacred Ganga water, adorned with a garland of serpents, to the thunderous sound of his Damaru drum — bless us with auspiciousness.',
  'Composed by the demon-king Ravana in praise of Shiva, the Shiva Tandava Stotram describes the cosmic dance of Shiva with great poetic force. Reciting it on Mondays and Maha Shivratri grants courage, vitality and Shiva''s grace.'
),
(
  'Lingashtakam', 'Shiva', 'Monday',
  'ब्रह्ममुरारिसुरार्चितलिङ्गं निर्मलभासितशोभितलिङ्गम्। जन्मजदुःखविनाशकलिङ्गं तत्प्रणमामि सदाशिवलिङ्गम्॥',
  'Brahma Murari Surarchita Lingam Nirmala Bhasita Shobhita Lingam, Janmaja Duhkha Vinashaka Lingam Tat Pranamaami Sada Shiva Lingam',
  'I bow to the Shivalinga, worshipped by Brahma, Vishnu and the gods, shining with pure radiance, destroyer of the sorrows born of the cycle of birth and death — the eternal Shivalinga.',
  'The Lingashtakam is an eight-verse hymn glorifying the Shivalinga. Recited during Shiva puja and Abhishekam, it is believed to destroy sins accumulated over multiple lifetimes and bestow moksha.'
),
(
  'Rudrashtakam', 'Shiva', 'Monday',
  'नमामीशमीशान निर्वाणरूपं विभुं व्यापकं ब्रह्मवेदस्वरूपम्। निजं निर्गुणं निर्विकल्पं निरीहं चिदाकाशमाकाशवासं भजेऽहम्॥',
  'Namaami Isham Ishan Nirvana Rupam Vibhum Vyapakam Brahma Veda Swarupam, Nijam Nirgunam Nirvikalpam Niriham Chidakasham Akashavaasam Bhaje''ham',
  'I salute Lord Shiva, the embodiment of liberation, all-pervading, the very form of the Vedas and Brahman, attributeless, free of all concepts and desires, the pure consciousness that pervades space — I worship him.',
  'Written by Goswami Tulsidas, the Rudrashtakam is recited to attain Shiva''s blessings for liberation from the cycle of birth and death. It is especially powerful when recited during the month of Shravan.'
),

-- ── VISHNU ───────────────────────────────────────────────────────────────────
(
  'Purusha Sukta', 'Vishnu', 'Thursday',
  'सहस्रशीर्षा पुरुषः सहस्राक्षः सहस्रपात्। स भूमिं विश्वतो वृत्वा अत्यतिष्ठद्दशाङ्गुलम्॥',
  'Sahasra Shirsha Purushah Sahasrakshah Sahasrapat, Sa Bhumim Vishvato Vritva Atyatishthaddasangulam',
  'The Cosmic Being (Purusha) has a thousand heads, a thousand eyes and a thousand feet. Encompassing the entire earth, He extends ten fingers beyond it.',
  'One of the most ancient hymns of the Rigveda, the Purusha Sukta describes the cosmic form of the supreme being and the creation of the universe. Recited during fire rituals and Vishnu puja, it bestows cosmic consciousness and liberation.'
),
(
  'Narayana Kavacham', 'Vishnu', 'Daily',
  'ॐ नमो नारायणाय। नारायण परं ब्रह्म तत्त्वं नारायणः परः। नारायण परं ज्योतिः आत्मा नारायणः परः॥',
  'Om Namo Narayanaya. Narayana Param Brahma Tattvam Narayanah Parah, Narayana Param Jyotih Atma Narayanah Parah',
  'Salutations to Narayana. Narayana is the supreme Brahman, the ultimate truth; Narayana is the supreme light; Narayana is the supreme Self.',
  'The Narayana Kavacham from the Srimad Bhagavatam is a powerful protective armour (kavach) prayer. Devotees recite it daily for protection from negative forces, diseases, enemies and all forms of danger.'
),
(
  'Hare Krishna Mahamantra', 'Vishnu', 'Daily',
  'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे। हरे राम हरे राम राम राम हरे हरे॥',
  'Hare Krishna Hare Krishna Krishna Krishna Hare Hare, Hare Rama Hare Rama Rama Rama Hare Hare',
  'O Hari (energy of the Lord), O Krishna, O Rama — this 16-word maha-mantra is a direct address to the divine energy (Hare/Radha) and the two supreme forms of Vishnu: Krishna and Rama.',
  'Declared the most powerful mantra for the present age (Kali Yuga) in the Kali-Santarana Upanishad, the Hare Krishna Mahamantra purifies the consciousness, eliminates material suffering and awakens pure devotional love for God.'
),

-- ── RAMA ─────────────────────────────────────────────────────────────────────
(
  'Sri Rama Raksha Stotram', 'Rama', 'Daily',
  'चरितं रघुनाथस्य शतकोटिप्रविस्तरम्। एकैकमक्षरं पुंसां महापातकनाशनम्॥',
  'Charitam Raghunathasya Shata Koti Pravistaram, Ekaikam Aksharam Punsam Mahapatakanashanam',
  'The story of Lord Raghunatha (Rama) is spread across a hundred crore verses — each single syllable of it is enough to destroy the greatest sins of human beings.',
  'The Rama Raksha Stotram is a protective prayer composed by the sage Vishvamitra (revealed in a dream). Reciting it daily is said to protect the devotee from all evil, disease and danger, acting as an armour (Raksha) of Lord Rama''s grace.'
),
(
  'Ram Raksha Stotra', 'Rama', 'Daily',
  'राम रामेति रामेति रमे रामे मनोरमे। सहस्रनाम तत्तुल्यं राम नाम वरानने॥',
  'Rama Rameti Rameti Rame Rame Manorame, Sahasranama Tattulyam Rama Nama Varanane',
  'O beautiful one, chanting the name of Rama — Rama, Rama, Rama — in the delightful form of Lord Rama is equal to reciting the thousand names of Vishnu (Vishnu Sahasranama).',
  'This verse from the Padma Purana (spoken by Shiva to Parvati) declares the supreme glory of the name "Rama". Regular chanting purifies the mind and is considered equivalent to the merit of reciting the Vishnu Sahasranama.'
),
(
  'Ram Naam', 'Rama', 'Daily',
  'श्री राम जय राम जय जय राम।',
  'Shri Ram Jai Ram Jai Jai Ram',
  'Victory to Lord Rama, victory, victory to Lord Rama — this simple yet supremely powerful chant glorifies the eternal victor Lord Rama.',
  'The Taraka Mantra revealed by Shiva to dying souls at Kashi. Continuously repeating "Shri Ram Jai Ram Jai Jai Ram" (particularly 13 crore times as in the Sant Ramdas tradition) is said to grant liberation and inner peace.'
),

-- ── DEVI / DURGA ─────────────────────────────────────────────────────────────
(
  'Durga Chalisa', 'Durga', 'Daily',
  'नमो नमो दुर्गे सुख करनी। नमो नमो अम्बे दुःख हरनी॥ निरंकार है ज्योति तुम्हारी। तिहूँ लोक फैली उजियारी॥',
  'Namo Namo Durge Sukh Karani, Namo Namo Ambe Dukh Harani, Nirankara Hai Jyoti Tumhari, Tihu Lok Pheli Ujiyari',
  'Salutations, salutations O Durga, giver of happiness; salutations, salutations O Amba, destroyer of sorrow. Your divine light is formless and spread across all three worlds.',
  'The Durga Chalisa is a 40-verse devotional hymn dedicated to Goddess Durga. Recited especially during Navaratri, it is believed to grant protection from enemies, relief from suffering and fulfilment of righteous desires.'
),
(
  'Argala Stotram', 'Durga', 'Daily',
  'जयन्ती मङ्गला काली भद्रकाली कपालिनी। दुर्गा क्षमा शिवा धात्री स्वाहा स्वधा नमोऽस्तु ते॥',
  'Jayanti Mangala Kali Bhadrakali Kapalini, Durga Kshama Shiva Dhatri Svaha Svadha Namostute',
  'Salutations to you — Jayanti (the victorious), Mangala (the auspicious), Kali (the destroyer of time), Bhadrakali (the gentle fierce one), Kapalini, Durga, Kshama (forgiveness), Shiva, Dhatri, Svaha and Svadha.',
  'The Argala Stotram from the Devi Mahatmyam is recited as an opening prayer before the main text. It is chanted for divine protection, worldly success, beauty, fame and victory over adversaries.'
),
(
  'Devi Kavacham', 'Durga', 'Daily',
  'प्रथमं शैलपुत्री च द्वितीयं ब्रह्मचारिणी। तृतीयं चन्द्रघण्टेति कूष्माण्डेति चतुर्थकम्॥',
  'Prathamam Shailaputri Cha Dvitiyam Brahmacharini, Tritiyam Chandraghanteti Kushmandeti Chaturthakam',
  'The first is Shailaputri, the second Brahmacharini, the third Chandraghanta and the fourth Kushmanda — the nine forms of Durga who form the divine armour (Kavach) of the goddess.',
  'The Devi Kavacham from the Durga Saptashati (Devi Mahatmyam) is a divine armour prayer in which each part of the body is protected by a specific form of the goddess. Recited daily, it shields the devotee from all negative energies and dangers.'
),

-- ── LAKSHMI ──────────────────────────────────────────────────────────────────
(
  'Lakshmi Ashtottara Shatanamavali', 'Lakshmi', 'Friday',
  'ॐ प्रकृत्यै नमः। ॐ विकृत्यै नमः। ॐ विद्यायै नमः। ॐ सर्वभूतहितप्रदायै नमः। ॐ श्रद्धायै नमः। ॐ विभूत्यै नमः। ॐ सुरभ्यै नमः। ॐ परमात्मिकायै नमः॥',
  'Om Prakrityai Namah. Om Vikrityai Namah. Om Vidyayai Namah. Om Sarvabhutahitapradayai Namah. Om Shraddhayai Namah. Om Vibhutyai Namah. Om Surabhyai Namah. Om Paramatmikayai Namah.',
  'Salutations to Lakshmi as the primordial nature, as transformation, as knowledge, as the benefactress of all beings, as faith, as divine wealth, as the fragrant one, and as the supreme Self.',
  'The 108 Names of Goddess Lakshmi, recited especially on Fridays and during Diwali. It is believed to attract prosperity, remove financial hardship, improve relationships and bring the goddess''s complete grace upon the household.'
),
(
  'Kanakadhara Stotram', 'Lakshmi', 'Friday',
  'अङ्गं हरेः पुलकभूषणमाश्रयन्ती भृङ्गाङ्गनेव मुकुलाभरणं तमालम्। अङ्गीकृताखिलविभूतिरपाङ्गलीला माङ्गल्यदास्तु मम मङ्गलदेवतायाः॥',
  'Angam Hareh Pulakabhushanam Ashrayanti Bhringanganeva Mukulabharanam Tamalam, Angikrirakhila Vibhutirpanagalila Mangalyadastu Mama Mangaladevataayah',
  'May the auspicious glances of Lakshmi, who embraces the form of Vishnu adorned with the thrill of joy (like a bee drawn to a blossoming Tamala tree), she who has accepted all divine powers — bestow auspiciousness upon me.',
  'Composed by Adi Shankaracharya after witnessing the poverty of a devotee woman, the Kanakadhara Stotram is believed to have caused a rain of golden gooseberries. Recited on Fridays and Akshaya Tritiya, it removes poverty and brings abundant prosperity.'
),

-- ── SARASWATI ────────────────────────────────────────────────────────────────
(
  'Saraswati Vandana', 'Saraswati', 'Daily',
  'या कुन्देन्दुतुषारहारधवला या शुभ्रवस्त्रावृता। या वीणावरदण्डमण्डितकरा या श्वेतपद्मासना॥ या ब्रह्माच्युतशंकरप्रभृतिभिर्देवैः सदा वन्दिता। सा माम् पातु सरस्वती भगवती निःशेषजाड्यापहा॥',
  'Ya Kundendutushara Hara Dhavala Ya Shubhra Vastra Avrita, Ya Veena Varadanda Manditakara Ya Shveta Padmasana, Ya Brahma Achyuta Shankara Prabhritihi Devaihi Sada Vandita, Sa Mam Patu Saraswati Bhagavati Nihshesha Jadyapaha',
  'May that Goddess Saraswati, white as the kunda flower, moon and snow-white garland, clad in spotless robes, holding the veena and bestowing blessings, seated on a white lotus, worshipped by Brahma, Vishnu and Shiva — protect me and remove all my ignorance.',
  'The most celebrated invocation to Goddess Saraswati, recited by students, scholars, artists and musicians before studies, exams, performances and on Saraswati Puja/Basant Panchami. It removes intellectual dullness and awakens creative brilliance.'
),
(
  'Saraswati Stotram', 'Saraswati', 'Wednesday',
  'सरस्वति नमस्तुभ्यं वरदे कामरूपिणि। विद्यारम्भं करिष्यामि सिद्धिर्भवतु मे सदा॥',
  'Saraswati Namastubhyam Varade Kamarupini, Vidyarambham Karishyami Siddhirbhavatu Me Sada',
  'O Saraswati, salutations to you, the boon-granting goddess who takes the form desired by the devotee — as I begin my studies, may I always attain success.',
  'The classic invocation to Saraswati recited at the beginning of studies (Vidyarambha). Children traditionally recite this before writing their first letters. Chanting it before any learning activity sharpens memory, clarity of speech and intelligence.'
),

-- ── SURYA / SUN ──────────────────────────────────────────────────────────────
(
  'Aditya Hridayam', 'Surya', 'Sunday',
  'ततो युद्धपरिश्रान्तं समरे चिन्तया स्थितम्। रावणं चाग्रतो दृष्ट्वा युद्धाय समुपस्थितम्॥ दैवतैश्च समागम्य द्रष्टुमभ्यागतो रणम्। उपागम्याब्रवीद्राममगस्त्यो भगवानृषिः॥',
  'Tato Yuddha Parishrantam Samare Chintaya Sthitam, Ravanam Chagrato Drishtva Yuddhaya Samupasthitam, Daivataischa Samagamya Drashtumabhyagato Ranam, Upagamyabravid Ramam Agastyo Bhagavan Rishih',
  'Then the holy sage Agastya, who had come with the gods to witness the battle, approached Rama — exhausted in the war and standing anxiously before Ravana who stood ready to fight — and spoke this hymn of the Sun.',
  'The Aditya Hridayam from the Valmiki Ramayana was taught by sage Agastya to Rama before the final battle with Ravana. Reciting it at sunrise on Sundays destroys enemies, cures diseases, removes all sins and bestows victory.'
),
(
  'Surya Gayatri Mantra', 'Surya', 'Sunday',
  'ॐ भास्कराय विद्महे महातेजाय धीमहि। तन्नो सूर्यः प्रचोदयात्॥',
  'Om Bhaskaraya Vidmahe Mahatejaya Dheemahi, Tanno Suryah Prachodayat',
  'We meditate upon the radiant Sun (Bhaskara), the great source of light and energy — may that Surya inspire and illuminate our intellect.',
  'The Gayatri mantra specifically dedicated to Surya, the Sun God. Chanted at sunrise facing the east, it is believed to strengthen eyesight, improve health, boost energy and bring clarity and confidence.'
),

-- ── NAVAGRAHA ────────────────────────────────────────────────────────────────
(
  'Navagraha Stotram', 'Navagraha', 'Sunday',
  'जपाकुसुमसङ्काशं काश्यपेयं महाद्युतिम्। तमोऽरिं सर्वपापघ्नं प्रणतोऽस्मि दिवाकरम्॥',
  'Japakusuma Sankasham Kashyapeyam Mahadyutim, Tamorim Sarvapapaghnam Pranatosmi Divakaram',
  'I bow to Surya (the Sun), who resembles the hibiscus flower in colour, who is the son of Kashyapa, of great radiance, the enemy of darkness and the destroyer of all sins.',
  'The Navagraha Stotram praises all nine planetary deities — Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu and Ketu. Recited on Sundays or during Navagraha puja, it pacifies malefic planetary influences and brings astrological harmony.'
),

-- ── UNIVERSAL / PEACE ────────────────────────────────────────────────────────
(
  'Shanti Mantra', 'Universal', 'Daily',
  'ॐ सह नाववतु। सह नौ भुनक्तु। सह वीर्यं करवावहै। तेजस्वि नावधीतमस्तु मा विद्विषावहै। ॐ शान्तिः शान्तिः शान्तिः॥',
  'Om Saha Navavatu, Saha Nau Bhunaktu, Saha Viryam Karavavahai, Tejasvi Navadhitamastu Ma Vidvishavahai, Om Shanti Shanti Shanti',
  'May we both be protected together. May we both be nourished together. May we both work with great energy together. May our study be radiant and fruitful. May we never hate each other. Om Peace, Peace, Peace.',
  'A Shanti (peace) mantra from the Taittiriya Upanishad, traditionally recited by teacher and student together before learning. It creates a sacred atmosphere of harmony, mutual respect and spiritual receptivity.'
),

-- ── AARTI ─────────────────────────────────────────────────────────────────────
(
  'Aarti Kunj Bihari Ki', 'Vishnu', 'Evening',
  'आरती कुंजबिहारी की, श्री गिरिधर कृष्ण मुरारी की॥ गले में बैजंती माला, बजावत बंसी मधुर बाला।',
  'Aarti Kunj Bihari Ki, Shri Giridhara Krishna Murari Ki, Gale Mein Baijanti Mala, Bajavat Bansi Madhur Bala',
  'We perform the aarti of Krishna, the one who roams the groves of Vrindavan, who lifted the Govardhan hill — wearing a Vaijayanti garland, playing his sweet flute.',
  'One of the most beloved evening aartis sung across North India in honour of Lord Krishna. Performed at dusk (sandhya aarti), it fills the heart with divine joy and devotion, inviting Krishna''s blessings into the home.'
),
(
  'Om Jai Jagdish Hare', 'Vishnu', 'Evening',
  'ॐ जय जगदीश हरे, स्वामी जय जगदीश हरे। भक्त जनों के संकट, क्षण में दूर करे॥',
  'Om Jai Jagdish Hare, Swami Jai Jagdish Hare, Bhakta Janon Ke Sankat, Kshan Mein Dur Kare',
  'Victory to you, O Lord of the Universe (Jagdish)! You instantly remove the difficulties of your devotees.',
  'The most universally sung Hindu aarti, offered to Lord Vishnu (the Lord of the Universe). Performed in homes and temples at dusk across India, it is a collective prayer that creates a powerful vibration of devotion and divine protection.'
),
(
  'Durga Aarti', 'Durga', 'Evening',
  'जय अम्बे गौरी, मैया जय श्यामा गौरी। तुमको निशदिन ध्यावत, हरि ब्रह्मा शिवरी॥',
  'Jai Ambe Gauri, Maiya Jai Shyama Gauri, Tumako Nish Din Dhyavat, Hari Brahma Shivari',
  'Victory to you, O bright Amba (Gauri), O dark Shyama Gauri — Vishnu, Brahma and Shiva meditate upon you day and night.',
  'The evening aarti sung to Goddess Durga in homes and temples, especially during Navaratri. It expresses devotion to the divine mother in all her forms and is believed to grant protection, fulfilment of wishes and freedom from fear.'
),
(
  'Hanuman Aarti', 'Hanuman', 'Tuesday',
  'आरती कीजै हनुमान लला की। दुष्ट दलन रघुनाथ कला की॥ जाके बल से गिरिवर काँपे। रोग दोष जाके निकट न झाँके॥',
  'Aarti Kijai Hanuman Lala Ki, Dushta Dalan Raghunath Kala Ki, Jake Bal Se Girivar Kampe, Roga Dosha Jake Nikat Na Jhanke',
  'Let us perform the aarti of Hanuman, the child devotee of Raghunath who destroys the wicked — at whose strength mountains tremble and near whom disease and sin dare not approach.',
  'The devotional aarti of Lord Hanuman, traditionally sung on Tuesdays and Saturdays. It is believed to bestow strength, courage and protection from disease, evil spirits and enemies when sung with sincere devotion.'
)

ON CONFLICT (title) DO UPDATE SET
    deity           = EXCLUDED.deity,
    frequency       = EXCLUDED.frequency,
    sanskrit        = EXCLUDED.sanskrit,
    transliteration = EXCLUDED.transliteration,
    meaning         = EXCLUDED.meaning,
    benefits        = EXCLUDED.benefits;
