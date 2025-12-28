const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'cheese', 'cheeseswap.json');
const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

const seen = new Map();
const duplicates = [];

const filtered = data.tokens.filter((token) => {
  const key = token.address ? token.address.toLowerCase() : null;
  if (!key) return true;

  if (seen.has(key)) {
    duplicates.push({
      original: seen.get(key),
      duplicate: token,
    });
    return false;
  }

  seen.set(key, token);
  return true;
});

if (duplicates.length) {
  console.log(`Removed ${duplicates.length} duplicate token entries:`);
  duplicates.forEach(({ original, duplicate }) => {
    console.log(` - kept: ${original.name || original.symbol || original.address} | removed: ${duplicate.name || duplicate.symbol || duplicate.address}`);
  });
} else {
  console.log('No duplicate addresses found.');
}

const nextData = { ...data, tokens: filtered };
fs.writeFileSync(filePath, `${JSON.stringify(nextData, null, 2)}\n`);
console.log(`Updated file written to ${filePath}`);
