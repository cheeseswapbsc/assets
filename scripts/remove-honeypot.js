const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'cheese', 'cheeseswap.json');
const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

const isHoneypot = (text) => {
  if (!text || typeof text !== 'string') return false;
  return text.toLowerCase().includes('honeypot');
};

const removed = [];

const filtered = data.tokens.filter((token) => {
  const { name, symbol, description } = token;
  const mark = [name, symbol, description].some(isHoneypot);
  if (mark) removed.push({ name, symbol, address: token.address });
  return !mark;
});

if (removed.length) {
  console.log(`Removing ${removed.length} honeypot-marked entries:`);
  removed.forEach((entry) => {
    console.log(` - ${entry.name || entry.symbol || 'Unnamed'} | ${entry.address}`);
  });
} else {
  console.log('No honeypot entries found.');
}

const nextData = { ...data, tokens: filtered };
fs.writeFileSync(filePath, `${JSON.stringify(nextData, null, 2)}\n`);
console.log(`Updated file written to ${filePath}`);
