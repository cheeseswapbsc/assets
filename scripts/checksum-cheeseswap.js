const fs = require('fs');
const path = require('path');
const Web3 = require('web3');

const web3 = new Web3();
const filePath = path.join(__dirname, '..', 'cheese', 'cheeseswap.json');

const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

const toChecksum = (value) => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim();
  if (!normalized.toLowerCase().startsWith('0x')) return value;
  if (normalized.length !== 42) return value;
  try {
    return web3.utils.toChecksumAddress(normalized);
  } catch (error) {
    console.warn(`Skipping invalid address: ${value}`);
    return value;
  }
};

data.tokens = data.tokens.map((token) => {
  const next = { ...token };
  if (next.address) next.address = toChecksum(next.address);
  if (next.id) next.id = toChecksum(next.id);
  return next;
});

fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Checksummed addresses written to ${filePath}`);
