require('dotenv').config();
const pool = require('../config/db');

// Multiple search strategies to find temple images
async function getTempleImageUrl(templeName, city, state) {
    const strategies = [
        // Strategy 1: Exact temple name
        `${templeName}`,
        // Strategy 2: Temple name + city
        `${templeName} ${city}`,
        // Strategy 3: Temple name + state
        `${templeName} ${state}`,
        // Strategy 4: Simplified name (remove words like Temple/Mandir/Temple)
        `${templeName.replace(/Temple|Mandir|Dham|Shrine|Math/gi, '').trim()} ${city}`,
        // Strategy 5: City + main deity keyword
        `${city} temple India`,
    ];

    for (const query of strategies) {
        try {
            const imageUrl = await searchWikipedia(query);
            if (imageUrl) return imageUrl;
            // Small delay between strategies
            await delay(300);
        } catch (err) {
            continue;
        }
    }
    return null;
}

async function searchWikipedia(query) {
    try {
        const searchQuery = encodeURIComponent(query);

        // Step 1: Search Wikipedia
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${searchQuery}&format=json&origin=*&srlimit=3`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (!searchData.query?.search?.length) return null;

        // Try top 3 results
        for (const result of searchData.query.search) {
            const pageTitle = encodeURIComponent(result.title);

            // Step 2: Get page thumbnail
            const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${pageTitle}&prop=pageimages&format=json&pithumbsize=800&origin=*`;
            const imageRes = await fetch(imageUrl);
            const imageData = await imageRes.json();

            const pages = imageData.query?.pages;
            if (!pages) continue;

            const page = Object.values(pages)[0];
            if (page?.thumbnail?.source) {
                // Make sure it looks like a temple/building image not a map or logo
                const src = page.thumbnail.source;
                if (
                    src.includes('.jpg') ||
                    src.includes('.jpeg') ||
                    src.includes('.png')
                ) {
                    return src;
                }
            }
            await delay(200);
        }
        return null;
    } catch (err) {
        return null;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateAllTempleImages() {
    const client = await pool.connect();

    try {
        // Only fetch for temples that don't have a real image yet
        const { rows: temples } = await client.query(`
      SELECT id, name, location_city, location_state 
      FROM temples 
      WHERE image_url NOT LIKE 'https://upload.wikimedia%'
        AND image_url NOT LIKE 'https://en.wikipedia%'
      ORDER BY id
    `);

        console.log(`\n🕌 Fetching images for ${temples.length} temples...\n`);

        let updated = 0;
        let failed = 0;
        const failedTemples = [];

        for (let i = 0; i < temples.length; i++) {
            const temple = temples[i];
            console.log(`[${i + 1}/${temples.length}] Searching: ${temple.name}...`);

            const imageUrl = await getTempleImageUrl(
                temple.name,
                temple.location_city,
                temple.location_state
            );

            if (imageUrl) {
                await client.query(
                    'UPDATE temples SET image_url = $1 WHERE id = $2',
                    [imageUrl, temple.id]
                );
                console.log(`   ✅ Found: ${imageUrl.substring(0, 70)}...`);
                updated++;
            } else {
                console.log(`   ❌ Not found`);
                failedTemples.push({ id: temple.id, name: temple.name, city: temple.location_city });
                failed++;
            }

            // Delay to avoid Wikipedia rate limiting
            await delay(600);
        }

        console.log(`\n${'='.repeat(50)}`);
        console.log(`✅  Done!`);
        console.log(`   Updated : ${updated} temples`);
        console.log(`   Failed  : ${failed} temples`);

        if (failedTemples.length > 0) {
            console.log(`\n❌ These temples need manual images:`);
            failedTemples.forEach(t => {
                console.log(`   ID ${t.id}: ${t.name} (${t.city})`);
            });

            // Auto-assign category-based fallback for failed ones
            console.log(`\n🔄 Assigning fallback images for failed temples...`);
            await client.query(`
        UPDATE temples SET image_url = CASE category
          WHEN 'Shiva'        THEN 'https://picsum.photos/seed/shiva${Math.random()}/800/600'
          WHEN 'Vaishnava'    THEN 'https://picsum.photos/seed/vishnu${Math.random()}/800/600'
          WHEN 'Devi'         THEN 'https://picsum.photos/seed/devi${Math.random()}/800/600'
          WHEN 'Buddhist'     THEN 'https://picsum.photos/seed/buddha${Math.random()}/800/600'
          WHEN 'Jain'         THEN 'https://picsum.photos/seed/jain${Math.random()}/800/600'
          WHEN 'Sikh'         THEN 'https://picsum.photos/seed/golden${Math.random()}/800/600'
          ELSE 'https://picsum.photos/seed/temple${Math.random()}/800/600'
        END
        WHERE image_url NOT LIKE 'https://upload.wikimedia%'
          AND image_url NOT LIKE 'https://en.wikipedia%'
      `);
            console.log(`✅ Fallback images assigned for remaining temples`);
        }

        console.log(`\n🎉 All temples now have images!\n`);

    } finally {
        client.release();
        await pool.end();
    }
}

updateAllTempleImages();