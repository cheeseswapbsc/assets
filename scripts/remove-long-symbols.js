const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'cheese', 'cheeseswap.json');
const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

const MAX_LENGTH = 8;

const removed = [];
const filtered = (data.tokens || []).filter((token) => {
  const symbol = token.symbol || '';
  if (symbol.length > MAX_LENGTH) {
    removed.push({ name: token.name, symbol, address: token.address });
    return false;
  }
  return true;
});

const nextData = { ...data, tokens: filtered };
fs.writeFileSync(filePath, `${JSON.stringify(nextData, null, 2)}\n`);

if (removed.length) {
  console.log(`Removed ${removed.length} tokens with symbol length greater than ${MAX_LENGTH}:`);
  removed.forEach((entry) => {
    console.log(` - ${entry.symbol} (${entry.name || 'Unnamed'}) | ${entry.address}`);
  });
} else {
  console.log(`No tokens found with symbol length greater than ${MAX_LENGTH}.`);
}
