-- ============================================================
-- DivineConnect Prayers Table — COMPLETE MANTRA TEXTS
-- Full Sanskrit + Transliteration for all  prayers
-- ============================================================

CREATE TABLE IF NOT EXISTS prayers (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    deity           VARCHAR(100) NOT NULL,
    frequency       VARCHAR(100),
    sanskrit        TEXT,
    transliteration TEXT,
    meaning         TEXT,
    benefits        TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_prayers_title ON prayers (title);

INSERT INTO prayers (title, deity, frequency, sanskrit, transliteration, meaning, benefits) VALUES
(
  'Gayatri Mantra', 'Savitri', 'Daily',
  'ॐ भूर्भुवः स्वः
तत्सवितुर्वरेण्यं
भर्गो देवस्य धीमहि
धियो यो नः प्रचोदयात्॥',
  'Om Bhur Bhuvah Swah
Tat Savitur Varenyam
Bhargo Devasya Dheemahi
Dhiyo Yo Nah Prachodayat',
  'O Divine mother, our hearts are filled with darkness. Please make this darkness distant from us and promote illumination within us. We meditate on the glory of that Being who has produced this universe; may He enlighten our minds. We meditate on the adorable glory of the radiant sun; may He inspire our intelligence.',
  'Recited at sunrise and sunset to awaken inner wisdom, clarity of mind and spiritual energy. Chanting 108 times daily is said to purify the mind, body and soul, bestowing divine protection and higher consciousness.'
),
(
  'Mahamrityunjaya Mantra', 'Shiva', 'Healing',
  'ॐ त्र्यम्बकं यजामहे
सुगन्धिं पुष्टिवर्धनम्।
उर्वारुकमिव बन्धनात्
मृत्योर्मुक्षीय माऽमृतात्॥',
  'Om Tryambakam Yajamahe
Sugandhim Pushtivardhanam
Urvarukamiva Bandhanan
Mrityormukshiya Maamritat',
  'We worship the three-eyed Lord Shiva who is fragrant and who nourishes all beings. May He liberate us from the bondage of death, just as a ripe cucumber is severed from its creeper, and may He not withhold immortality from us.',
  'A powerful healing mantra for protection from untimely death, serious illness and deep-seated fear. Chanting this mantra 108 times daily or during illness invokes Lord Shiva''s grace for physical healing, mental peace and liberation (moksha).'
),
(
  'Hanuman Chalisa', 'Hanuman', 'Daily',
  E'\nश्री गुरु चरन सरोज रज, निज मन मुकुर सुधारि।\nबरनऊं रघुबर बिमल जसु, जो दायक फल चारि॥\nबुद्धिहीन तनु जानिके, सुमिरौं पवन-कुमार।\nबल बुद्धि विद्या देहु मोहि, हरहु कलेस विकार॥\n\nचौपाई:\nजय हनुमान ज्ञान गुन सागर। जय कपीस तिहुं लोक उजागर॥\nराम दूत अतुलित बल धामा। अंजनि-पुत्र पवनसुत नामा॥\nमहावीर विक्रम बजरंगी। कुमति निवार सुमति के संगी॥\nकंचन बरन बिराज सुबेसा। कानन कुण्डल कुंचित केसा॥\nहाथ बज्र औ ध्वजा बिराजे। कांधे मूंज जनेऊ साजे॥\nशंकर सुवन केसरी नंदन। तेज प्रताप महा जग बंदन॥\nविद्यावान गुनी अति चातुर। राम काज करिबे को आतुर॥\nप्रभु चरित्र सुनिबे को रसिया। राम लखन सीता मन बसिया॥\nसूक्ष्म रूप धरि सियहिं दिखावा। बिकट रूप धरि लंक जरावा॥\nभीम रूप धरि असुर संहारे। रामचंद्र के काज संवारे॥\nलाय सजीवन लखन जियाये। श्रीरघुबीर हरषि उर लाये॥\nरघुपति कीन्ही बहुत बड़ाई। तुम मम प्रिय भरतहि सम भाई॥\nसहस बदन तुम्हरो जस गावैं। अस कहि श्रीपति कंठ लगावैं॥\nसनकादिक ब्रह्मादि मुनीसा। नारद सारद सहित अहीसा॥\nजम कुबेर दिगपाल जहां ते। कवि कोविद कहि सके कहां ते॥\nतुम उपकार सुग्रीवहिं कीन्हा। राम मिलाय राज पद दीन्हा॥\nतुम्हरो मंत्र विभीषण माना। लंकेश्वर भए सब जग जाना॥\nजुग सहस्र जोजन पर भानू। लील्यो ताहि मधुर फल जानू॥\nप्रभु मुद्रिका मेलि मुख माहीं। जलधि लांघि गये अचरज नाहीं॥\nदुर्गम काज जगत के जेते। सुगम अनुग्रह तुम्हरे तेते॥\nराम दुआरे तुम रखवारे। होत न आज्ञा बिनु पैसारे॥\nसब सुख लहैं तुम्हारी सरना। तुम रक्षक काहू को डर ना॥\nआपन तेज सम्हारो आपे। तीनों लोक हांक ते कांपे॥\nभूत पिशाच निकट नहिं आवे। महावीर जब नाम सुनावे॥\nनासे रोग हरे सब पीरा। जपत निरंतर हनुमत बीरा॥\nसंकट से हनुमान छुड़ावे। मन क्रम बचन ध्यान जो लावे॥\nसब पर राम तपस्वी राजा। तिन के काज सकल तुम साजा॥\nऔर मनोरथ जो कोई लावे। सोई अमित जीवन फल पावे॥\nचारों जुग परताप तुम्हारा। है परसिद्ध जगत उजियारा॥\nसाधु-संत के तुम रखवारे। असुर निकंदन राम दुलारे॥\nअष्ट सिद्धि नव निधि के दाता। अस बर दीन जानकी माता॥\nराम रसायन तुम्हरे पासा। सदा रहो रघुपति के दासा॥\nतुम्हरे भजन राम को पावे। जनम-जनम के दुख बिसरावे॥\nअंत काल रघुबर पुर जाई। जहां जन्म हरि-भक्त कहाई॥\nऔर देवता चित्त न धरई। हनुमत सेई सर्व सुख करई॥\nसंकट कटे मिटे सब पीरा। जो सुमिरै हनुमत बलबीरा॥\nजय जय जय हनुमान गोसाईं। कृपा करहु गुरुदेव की नाईं॥\nजो सत बार पाठ कर कोई। छूटहि बंदि महा सुख होई॥\nजो यह पढ़े हनुमान चालीसा। होय सिद्धि साखी गौरीसा॥\nतुलसीदास सदा हरि चेरा। कीजे नाथ हृदय मंह डेरा॥\n\nदोहा:\nपवन तनय संकट हरन, मंगल मूरति रूप।\nराम लखन सीता सहित, हृदय बसहु सुर भूप॥',
  E':\nShri Guru Charan Saroj Raj, Nij Man Mukur Sudhari\nBaranau Raghubar Bimal Jasu, Jo Dayaku Phal Chari\nBuddhiheen Tanu Janike, Sumirau Pavan-Kumar\nBal Buddhi Vidya Dehu Mohi, Harahu Kalesh Vikaar\n\nChaupai:\nJai Hanuman Gyan Gun Sagar, Jai Kapis Tihun Lok Ujagar\nRam Doot Atulit Bal Dhama, Anjani-Putra Pavansut Nama\nMahaveer Vikram Bajrangi, Kumati Niwar Sumati Ke Sangi\nKanchan Baran Biraj Subesa, Kanan Kundal Kunchit Kesa\nHaath Bajra Au Dhwaja Biraje, Kandhe Moonj Janeu Saje\nShankar Suvan Kesari Nandan, Tej Pratap Maha Jag Bandan\nVidyavaan Guni Ati Chatur, Ram Kaaj Karibe Ko Aatur\nPrabhu Charitra Sunibe Ko Rasiya, Ram Lakhan Sita Man Basiya\nSookshma Roop Dhari Siyahi Dikhawa, Bikat Roop Dhari Lank Jaraawa\nBheem Roop Dhari Asur Sanghare, Ramchandra Ke Kaaj Sanware\nLaay Sajeevan Lakhan Jiyaaye, Shriraghubar Harashi Ur Laaye\nRaghupati Keenhi Bahut Badaai, Tum Mam Priya Bharatahi Sam Bhai\nSahas Badan Tumharo Jas Gaavain, As Kahi Shripati Kanth Lagavain\nSanakaadik Brahmaadi Muneesa, Naarad Sarad Sahit Aheesa\nJam Kuber Digpaal Jahan Te, Kavi Kovid Kahi Sake Kahan Te\nTum Upkaar Sugreevahi Keenha, Ram Milaay Raj Pad Deenha\nTumharo Mantra Vibheeshan Maana, Lankeshwar Bhaye Sab Jag Jana\nJug Sahastra Jojan Par Bhanu, Leelyo Taahi Madhur Phal Jaanu\nPrabhu Mudrika Meli Mukh Maahi, Jaladhi Laanghi Gaye Acharaj Naahi\nDurgam Kaaj Jagat Ke Jete, Sugam Anugrah Tumhare Tete\nRam Duaare Tum Rakhwaare, Hot Na Aagya Binu Paisaare\nSab Sukh Lahain Tumhari Sarna, Tum Rakshak Kahu Ko Dar Na\nAapan Tej Samharo Aape, Teenon Lok Haank Te Kaanpe\nBhoot Pishaach Nikat Nahi Aave, Mahaveer Jab Naam Sunaave\nNaase Rog Hare Sab Peera, Japat Nirantar Hanumat Beera\nSankat Se Hanuman Chhurave, Man Kram Bachan Dhyan Jo Laave\nSab Par Ram Tapasvi Raja, Tin Ke Kaaj Sakal Tum Saja\nAur Manorath Jo Koi Laave, Soi Amit Jeevan Phal Paave\nCharon Jug Partap Tumhara, Hai Parsiddh Jagat Ujiyara\nSadhu-Sant Ke Tum Rakhwaare, Asur Nikandan Ram Dulaare\nAsht Siddhi Nav Nidhi Ke Data, As Bar Deen Janaki Mata\nRam Rasayan Tumhare Pasa, Sada Raho Raghupati Ke Dasa\nTumhare Bhajan Ram Ko Paave, Janam-Janam Ke Dukh Bisraave\nAnt Kaal Raghubar Pur Jai, Jahan Janm Hari-Bhakt Kahai\nAur Devta Chitt Na Dharai, Hanumat Sei Sarv Sukh Karai\nSankat Kate Mite Sab Peera, Jo Sumirai Hanumat Balbeera\nJai Jai Jai Hanuman Gosain, Kripa Karahu Gurudev Ki Nain\nJo Sat Baar Paath Kar Koi, Chhootahi Bandi Maha Sukh Hoi\nJo Yeh Padhe Hanuman Chalisa, Hoy Siddhi Sakhi Gaurisa\nTulasidas Sada Hari Chera, Keeje Naath Hriday Mah Dera\n\nDoha:\nPawan Tanay Sankat Haran, Mangal Moorati Roop\nRam Lakhan Sita Sahit, Hriday Basahu Sur Bhoop',
  'A 40-verse devotional hymn composed by Tulsidas in Awadhi, praising the virtues, deeds and glory of Lord Hanuman — from his divine birth and physical form to his legendary feats including crossing the ocean to Lanka, reviving Lakshmana and serving Lord Rama with absolute devotion.',
  'Chanted daily for courage, strength and protection from negative energies, evil spirits and obstacles. Reciting 100 times is said to free one from all bondage. A complete path to Lord Rama''s grace flows through devotion to Hanuman.'
),
(
  'Vishnu Sahasranama', 'Vishnu', 'Thursday',
  E'ॐ विश्वं विष्णुर्वषट्कारो भूतभव्यभवत्प्रभुः।\nभूतकृत् भूतभृद् भावो भूतात्मा भूतभावनः॥\nपूतात्मा परमात्मा च मुक्तानां परमागतिः।\nअव्ययः पुरुषः साक्षी क्षेत्रज्ञोऽक्षर एव च॥\nयोगो योगविदां नेता प्रधानपुरुषेश्वरः।\nनारसिंहवपुः श्रीमान् केशवः पुरुषोत्तमः॥\nसर्वः शर्वः शिवः स्थाणुर्भूतादिर्निधिरव्ययः।\nसम्भवो भावनो भर्ता प्रभवः प्रभुरीश्वरः॥\nस्वयम्भूः शम्भुरादित्यः पुष्कराक्षो महास्वनः।\nअनादिनिधनो धाता विधाता धातुरुत्तमः॥\nअप्रमेयो हृषीकेशः पद्मनाभोऽमरप्रभुः।\nविश्वकर्मा मनुस्त्वष्टा स्थविष्ठः स्थविरो ध्रुवः॥\nअग्राह्यः शाश्वतः कृष्णो लोहिताक्षः प्रतर्दनः।\nप्रभूतस्त्रिककुब्धाम पवित्रं मङ्गलं परम्॥\nईशानः प्राणदः प्राणो ज्येष्ठः श्रेष्ठः प्रजापतिः।\nहिरण्यगर्भो भूगर्भो माधवो मधुसूदनः॥\nईश्वरो विक्रमी धन्वी मेधावी विक्रमः क्रमः।\nअनुत्तमो दुराधर्षः कृतज्ञः कृतिरात्मवान्॥\nसुरेशः शरणं शर्म विश्वरेताः प्रजाभवः।\nअहः संवत्सरो व्यालः प्रत्ययः सर्वदर्शनः॥\nअजः सर्वेश्वरः सिद्धः सिद्धिः सर्वादिरच्युतः।\nवृषाकपिरमेयात्मा सर्वयोगविनिःसृतः॥\nवसुर्वसुमनाः सत्यः समात्मा सम्मितः समः।\nअमोघः पुण्डरीकाक्षो वृषकर्मा वृषाकृतिः॥\nरुद्रो बहुशिरा बभ्रुर्विश्वयोनिः शुचिश्रवाः।\nअमृतः शाश्वतः स्थाणुर्वरारोहो महातपाः॥\nसर्वगः सर्वविद्भानुर्विष्वक्सेनो जनार्दनः।\nवेदो वेदविदव्यङ्गो वेदाङ्गो वेदवित् कविः॥\nलोकाध्यक्षः सुराध्यक्षो धर्माध्यक्षः कृताकृतः।\nचतुरात्मा चतुर्व्यूहश्चतुर्दंष्ट्रश्चतुर्भुजः॥\nभ्राजिष्णुर्भोजनं भोक्ता सहिष्णुर्जगदादिजः।\nअनघो विजयो जेता विश्वयोनिः पुनर्वसुः॥\nउपेन्द्रो वामनः प्रांशुरमोघः शुचिरूर्जितः।\nअतीन्द्रः संग्रहः सर्गो धृतात्मा नियमो यमः॥\nवेद्यो वैद्यः सदायोगी वीरहा माधवो मधुः।\nअतीन्द्रियो महामायो महोत्साहो महाबलः॥\nमहाबुद्धिर्महावीर्यो महाशक्तिर्महाद्युतिः।\nअनिर्देश्यवपुः श्रीमानमेयात्मा महाद्रिधृत्॥\nमहेष्वासो महीभर्ता श्रीनिवासः सतांगतिः।\nअनिरुद्धः सुरानन्दो गोविन्दो गोविदां पतिः॥\nमरीचिर्दमनो हंसः सुपर्णो भुजगोत्तमः।\nहिरण्यनाभः सुतपाः पद्मनाभः प्रजापतिः॥\nअमृत्युः सर्वदृक् सिंहः सन्धाता सन्धिमान् स्थिरः।\nअजो दुर्मर्षणः शास्ता विश्रुतात्मा सुरारिहा॥\nगुरुर्गुरुतमो धाम सत्यः सत्यपराक्रमः।\nनिमिषोऽनिमिषः स्रग्वी वाचस्पतिरुदारधीः॥\nअग्रणीर्ग्रामणीः श्रीमान् न्यायो नेता समीरणः।\nसहस्रमूर्धा विश्वात्मा सहस्राक्षः सहस्रपात्॥\nआवर्तनो निवृत्तात्मा संवृतः सम्प्रमर्दनः।\nअहः संवर्तको वह्निरनिलो धरणीधरः॥\nसुप्रसादः प्रसन्नात्मा विश्वधृग् विश्वभुग् विभुः।\nसत्कर्ता सत्कृतः साधुर्जह्नुर्नारायणो नरः॥\nअसङ्ख्येयोऽप्रमेयात्मा विशिष्टः शिष्टकृच्छुचिः।\nसिद्धार्थः सिद्धसङ्कल्पः सिद्धिदः सिद्धिसाधनः॥\nवृषाही वृषभो विष्णुर्वृषपर्वा वृषोदरः।\nवर्धनो वर्धमानश्च विविक्तः श्रुतिसागरः॥\nसुभुजो दुर्धरो वाग्मी महेन्द्रो वसुदो वसुः।\nनैकरूपो बृहद्रूपः शिपिविष्टः प्रकाशनः॥\nओजस्तेजोद्युतिधरः प्रकाशात्मा प्रतापनः।\nऋद्धः स्पष्टाक्षरो मन्त्रश्चन्द्रांशुर्भास्करद्युतिः॥\nअमृतांशूद्भवो भानुः शशबिन्दुः सुरेश्वरः।\nऔषधं जगतः सेतुः सत्यधर्मपराक्रमः॥\nभूतभव्यभवन्नाथः पवनः पावनोऽनलः।\nकामहा कामकृत् कान्तः कामः कामप्रदः प्रभुः॥\nयुगादिकृद्युगावर्तो नैकमायो महाशनः।\nअदृश्यो व्यक्तरूपश्च सहस्रजिदनन्तजित्॥\nइष्टोऽविशिष्टः शिष्टेष्टः शिखण्डी नहुषो वृषः।\nक्रोधहा क्रोधकृत् कर्ता विश्वबाहुर्महीधरः॥\nअच्युतः प्रथितः प्राणः प्राणदो वासवानुजः।\nअपांनिधिरधिष्ठानमप्रमत्तः प्रतिष्ठितः॥\nस्कन्दः स्कन्दधरो धुर्यो वरदो वायुवाहनः।\nवासुदेवो बृहद्भानुरादिदेवः पुरन्दरः॥\nअशोकस्तारणस्तारः शूरः शौरिर्जनेश्वरः।\nअनुकूलः शतावर्तः पद्मी पद्मनिभेक्षणः॥\nपद्मनाभोऽरविन्दाक्षः पद्मगर्भः शरीरभृत्।\nमहर्द्धिर्ऋद्धो वृद्धात्मा महाक्षो गरुडध्वजः॥\nअतुलः शरभो भीमः समयज्ञो हविर्हरिः।\nसर्वलक्षणलक्षण्यो लक्ष्मीवान् समितिञ्जयः॥\nफलाशी फलकर्ता च फलदः फलभावनः।\nआदिभूतं महाकर्मा सर्वकारणकारणम्॥',
  E'Om Vishvam Vishnur Vashatkaro Bhuta-Bhavya-Bhavat-Prabhuh\nBhutakrit Bhutabhrid Bhavo Bhutatma Bhutabhavanah\nPutatma Paramatma Cha Muktanam Paramagatih\nAvyayah Purushah Sakshi Kshetragjno Akshara Eva Cha\nYogo Yogavidham Neta Pradhanapurusheshvarah\nNarasimhavapuh Shriman Keshavah Purushottamah\nSarvah Sharvah Shivah Sthanur Bhutadir Nidhir Avyayah\nSambhavo Bhaavano Bharta Prabhavah Prabhur Ishvarah\nSwayambhuh Shambhur Adityah Pushkarakso Mahasvanah\nAnadinadhano Dhata Vidhata Dhaturuttamah\nAprameyah Hrishikheshah Padmanabho Amaraprabhuh\nVishvakarma Manustvashttha Stavishthah Sthaviro Dhruvah\nAgrahyah Shashvatah Krishno Lohitakshah Pratardanah\nPrabhutas Trikakubdhama Pavitram Mangalam Param\nIshanah Pranadah Prano Jyeshthah Shresthah Prajapatih\nHiranyagarbho Bhugarbho Madhavo Madhusudhanah\nIshvaro Vikrami Dhanvi Medhavi Vikramah Kramah\nAnuttamo Duradharsah Kritagnah Kritiratmavan\nSureshaha Sharanam Sharma Vishvaretah Prabhavah\nAhah Samvatsaro Vyalah Pratyayah Sarvadarashanah\nAjah Sarveshvarah Siddhah Sidhih Sarvadiraachyutah\nVrishakapi Rameyatma Sarvayogavinihsritah\nVasurvarsumana Satyah Samatma Sammitah Samah\nAmoghah Pundarikakso Vrishakarmaa Vrishaakritih\nRudro Bahushira Babhrurvishvayonih Shuchishravah\nAmritah Shashvatah Sthanur Vararoho Mahatapah\nSarvagah Sarvavid Bhanur Vishvakaseno Janardanah\nVedo Vedavid Avyango Vedango Vedavit Kavih\nLokadhyakshah Suradhyaksho Dharmadhyakshah Kritakritah\nChaturatma Chaturvyuhas Chaturdamshtras Chaturbhujah\nBhrajishnur Bhojanam Bhokta Sahishnur Jagadadijah\nAnagho Vijayo Jeta Vishvayonih Punarvasuh\nUpendroh Vamanah Pramshu Ramogha Shuchirurijitah\nAtindrah Sangrahah Sargo Dhritatma Niyamo Yamah\nVedyo Vaidyah Sadayogi Veeraha Madhavo Madhuh\nAtindriyoh Mahamayo Mahotsaho Mahabalah\nMahabuddhir Mahaveeryo Mahashaktir Mahadyutih\nAnirdeshyavapuh Shriman Ameyatma Mahadridhrit\nMaheshvaso Mahibharta Shrinivesah Satam Gatih\nAniruddhah Surananado Govindao Govidam Patih\nMarichir Damano Hamsah Suparno Bhujagottamah\nHiranyonabhah Sutapah Padmanabhah Prajapat\nAmrityuh Sarvadrik Simhah Sandhata Sandhiman Sthirah\nAjo Durmarshano Shasta Vishrutatma Suraariha\nGurur Gurutamo Dhama Satyah Satyaparakramah\nNimisho Animishah Sragvi Vachaspatirudaradhih\nAgraner Gramanih Shriman Nyayo Neta Samiranah\nSahasramurdha Vishvatma Sahasrakshah Sahasrapat\nAvartano Nivrirtatma Samvritah Sampramardanah\nAhah Samvartako Vahnir Anilo Dharaniidharah\nSuprasadah Prasannatma Vishvadhrik Vishvabhug Vibhuh\nSatkarta Satktritah Sadhur Jahnur Narayano Narah\nAsankheyah Aprameyatma Vishishtah Shishtakrichhhchhuchih\nSiddharthah Siddhasankalpah Siddhidah Siddhi Sadhanah\nVrishahi Vrishabho Vishnur Vrishapavra Vrishodarah\nVardhano Vardhamanascha Viviktah Shrutisagarah\nSubhujo Durdharo Vagmi Mahendro Vasudo Vasuh\nNaikarupo Brihadrpah Shipivishth Prakashanah\nOjas Tejodyutidarah Prakashatma Pratapanah\nRiddhah Spashttaksharo Mantras Chandramshur Bhaskardyutih\nAmritamshudbhavo Bhanuh Shashabindur Suresvarah\nAushudham Jagatasah Setuh Satyadharmaparakramah\nBhutabhavya Bhavannatah Pavanh Pavano Analah\nKamaha Kamakrit Kantah Kamah Kamapradah Prabhuh\nYugadikriyugavarto Naikamayo Mahashanah\nAdrishyo Vyaktarupascha Sahasrajid Anantajit\nIshto Vishishtah Shishtesh Shikhandi Nahusho Vrishah\nKrodhaha Krodha Krit Karta Vishvabahur Mahidharah\nAchyutah Prathitah Pranah Pranado Vasavanujah\nApannidhir Adhishthanam Apramahtah Pratishthitah\nSkandah Skandadharo Dhuryo Varado Vayuvahanah\nVasudevo Brihadbhanur Addevah Purandarah\nAshokastaarana Taarah Shurah Shauri Janeshvarah\nAnukoolah Shatavartah Padmi Padmanibhekshanah\nPadmanabho Aravindakshah Padmagarbhah Shareerbhrit\nMaharddhir Riddho Vridhatma Mahakso Garudhavajah\nAtulah Sharabho Bhimah Samayagnoh Havir Harih\nSarvalakshana Lakshanyo Lakshmivan Samitinjayah\nPhalashi Phalakarta Cha Phaladah Phalabhavanah\nAaadibhutam Mahakarma Sarvakaaranakaaranam',
  'A hymn of the thousand names of Lord Vishnu from the Anushasana Parva of the Mahabharata, each name describing a divine attribute — from Vishnu as the universe itself to His roles as creator, sustainer, destroyer, liberator and the ultimate reality beyond all.',
  'Reciting the Vishnu Sahasranama daily or on Thursdays is said to bring peace, prosperity, good health and liberation. It removes all sins, bestows long life, and is considered equivalent to performing great yagnas (fire sacrifices).'
),
(
  'Sri Lakshmi Stotram', 'Lakshmi', 'Friday',
  E'नमस्तेऽस्तु महामाये श्रीपीठे सुरपूजिते।\nशङ्खचक्रगदाहस्ते महालक्ष्मि नमोऽस्तु ते॥\nनमस्ते गरुडारूढे कोलासुरभयङ्करि।\nसर्वपापहरे देवि महालक्ष्मि नमोऽस्तु ते॥\nसर्वज्ञे सर्ववरदे सर्वदुष्टभयङ्करि।\nसर्वदुःखहरे देवि महालक्ष्मि नमोऽस्तु ते॥\nसिद्धिबुद्धिप्रदे देवि भुक्तिमुक्तिप्रदायिनि।\nमन्त्रमूर्ते सदा देवि महालक्ष्मि नमोऽस्तु ते॥\nआद्यन्तरहिते देवि आदिशक्तिमहेश्वरि।\nयोगजे योगसम्भूते महालक्ष्मि नमोऽस्तु ते॥\nस्थूलसूक्ष्ममहारौद्रे महाशक्तिमहोदरे।\nमहापापहरे देवि महालक्ष्मि नमोऽस्तु ते॥\nपद्मासनस्थिते देवि परब्रह्मस्वरूपिणि।\nपरमेशि जगन्मातर्महालक्ष्मि नमोऽस्तु ते॥\nश्वेताम्बरधरे देवि नानालङ्कारभूषिते।\nजगत्स्थिते जगन्मातर्महालक्ष्मि नमोऽस्तु ते॥\nमहालक्ष्म्यष्टकं स्तोत्रं यः पठेद् भक्तिमान् नरः।\nसर्वसिद्धिमवाप्नोति राज्यं प्राप्नोति सर्वदा॥\nएककाले पठेन्नित्यं महापापविनाशनम्।\nद्विकालं यः पठेन्नित्यं धनधान्यसमन्वितः॥\nत्रिकालं यः पठेन्नित्यं महाशत्रुविनाशनम्।\nमहालक्ष्मीर्भवेन्नित्यं प्रसन्ना वरदा शुभा॥',
  E'Namaste''stu Mahamaye Shripithe Surapujite\nShankha-Chakra-Gada-Haste Mahalakshmi Namostute\nNamaste Garudarudhe Kolasura Bhayankari\nSarva-Papa-Hare Devi Mahalakshmi Namostute\nSarvagne Sarva-Varade Sarva-Dushta-Bhayankari\nSarva-Duhkha-Hare Devi Mahalakshmi Namostute\nSiddhi-Buddhi-Prade Devi Bhukti-Mukti-Pradayini\nMantra-Murte Sada Devi Mahalakshmi Namostute\nAdyantarahite Devi Adishakti Maheshvari\nYogaje Yoga-Sambhute Mahalakshmi Namostute\nSthula-Sukshma-Maharaudre Mahashakti-Mahodare\nMahapapa-Hare Devi Mahalakshmi Namostute\nPadmasanasthite Devi Parabrahma-Svarupini\nParameshi Jaganmatar Mahalakshmi Namostute\nShvetambara-Dhare Devi Nana-Lankara-Bhushite\nJagattsthite Jaganmatar Mahalakshmi Namostute\nMahalakshmyashtakam Stotram Yah Pathed Bhakti-Man Narah\nSarva-Siddhi-Mavapnoti Rajyam Prapnoti Sarvada\nEkakalam Pathennityam Mahapapa-Vinashanam\nDvikalam Yah Pathennityam Dhana-Dhanya-Samanvitah\nTrikalam Yah Pathennityam Mahashatru-Vinashanam\nMahalakshmih Bhavennityam Prasanna Varada Shubha',
  'An eight-verse hymn (ashtakam) to Goddess Mahalakshmi from the Padma Purana. Each verse salutes Her as the supreme goddess seated on a lotus, riding Garuda, destroyer of Kolasura, embodiment of wisdom and liberation, the primordial power beyond beginning and end, and the mother of the universe dressed in white adorned with ornaments.',
  'Reciting this ashtakam daily brings all forms of success and sovereignty. Chanting once daily destroys great sins; twice brings wealth and grain; thrice destroys enemies. Goddess Mahalakshmi becomes ever-pleased and bestows boons on devoted worshippers, especially on Fridays.'
),
(
  'Ganesh Vandana', 'Ganesha', 'Daily',
  E'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।\nनिर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥\nगजाननं भूतगणादिसेवितं\nकपित्थजम्बूफलचारुभक्षणम्।\nउमासुतं शोकविनाशकारणं\nनमामि विघ्नेश्वरपादपङ्कजम्॥\nअगजाननपद्मार्कं गजाननमहर्निशम्।\nअनेकदन्तं भक्तानां एकदन्तमुपास्महे॥\nमूषिकवाहन मोदकहस्त चामरकर्ण विलम्बितसूत्र।\nवामनरूप महेश्वरपुत्र विघ्नविनायक पाद नमस्ते॥\nगणानां त्वा गणपतिं हवामहे\nकविं कवीनामुपमश्रवस्तमम्।\nज्येष्ठराजं ब्रह्मणां ब्रह्मणस्पत\nआ नः शृण्वन्नूतिभिः सीद सादनम्॥\nप्रणम्य शिरसा देवं गौरीपुत्रं विनायकम्।\nभक्तावासं स्मरेन्नित्यं आयुःकामार्थसिद्धये॥',
  E'Vakratunda Mahakaya Suryakoti Samaprabha\nNirvighnam Kuru Me Deva Sarva-Karyeshu Sarvada\nGajananam Bhuta-Gana-Adi-Sevitam\nKapittha-Jambu-Phala-Charu-Bhakshanam\nUmasutam Shoka-Vinasha-Karanam\nNamami Vighnesvara-Pada-Pankajam\nAgajananpadmarkam Gajananamaharnisham\nAnekadantam Bhaktanam Ekadantamupasmahe\nMushikavahana Modakahasta Chamarakarna Vilambita-Sutra\nVamanarupa Maheshvara-Putra Vighnavinayaka Pada Namaste\nGananam Tva Ganapatim Havamamhe\nKavim Kaveena Mupamashravastamam\nJyeshtharajam Brahmanam Brahmanaspata\nAa Nah Shrinvan Nutibhih Sida Sadanam\nPranamya Shirasa Devam Gauriputram Vinayakam\nBhaktavasam Smaren Nityam Ayuh-Kama-Artha-Siddhaye',
  'A collection of six invocatory verses to Lord Ganesha — the remover of obstacles, son of Goddess Uma (Parvati), with an elephant head, riding a mouse, holding a modaka sweet, with fan-like ears and a sacred thread. He is praised as the lord of all ganas (divine attendants), foremost among the wise, eldest among the Brahman lords, and the eternal refuge of devotees.',
  'Recited before beginning any new undertaking, journey, ritual or study to invoke Lord Ganesha''s blessings for an obstacle-free path. Daily remembrance of Ganesha is said to grant long life, fulfilment of desires and material and spiritual success.'
),

-- ── GANESHA (additional) ──────────────────────────────────────────────────────
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

-- ── SHIVA (additional) ────────────────────────────────────────────────────────
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

-- ── VISHNU (additional) ───────────────────────────────────────────────────────
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

-- ── LAKSHMI (additional) ──────────────────────────────────────────────────────
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
    benefits        = EXCLUDED.benefits,
    updated_at      = NOW();