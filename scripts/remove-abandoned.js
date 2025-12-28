const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'cheese', 'cheeseswap.json');
const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

const removed = [];

const filtered = (data.tokens || []).filter((token) => {
  if ((token.status || '').toLowerCase() === 'abandoned') {
    removed.push(token);
    return false;
  }
  return true;
});

const nextData = { ...data, tokens: filtered };
fs.writeFileSync(filePath, `${JSON.stringify(nextData, null, 2)}\n`);

if (removed.length) {
  console.log(`Removed ${removed.length} abandoned tokens:`);
  removed.forEach((token) => {
    console.log(` - ${token.name || token.symbol || token.address}`);
  });
} else {
  console.log('No abandoned tokens found.');
}
