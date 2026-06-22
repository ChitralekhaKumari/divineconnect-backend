const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, 'src', 'scripts', 'seed_temples.sql');
let sql = fs.readFileSync(sqlPath, 'utf8');

// Fix all backslash-escaped single quotes to SQL double single quotes
sql = sql.replace(/\\'/g, "''");

fs.writeFileSync(sqlPath, sql, 'utf8');
console.log('✅ Fixed all apostrophes in seed_temples.sql');