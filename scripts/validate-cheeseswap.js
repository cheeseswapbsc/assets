const fs = require('fs');
const path = require('path');
const Web3 = require('web3');

const web3 = new Web3();
const filePath = path.join(__dirname, '..', 'cheese', 'cheeseswap.json');

const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

const ZERO = '0x0000000000000000000000000000000000000000';

const isValidChecksumAddress = (value) => {
  if (typeof value !== 'string') return false;
  const normalized = value.trim();
  if (!normalized.startsWith('0x') || normalized.length !== 42) return false;
  const lower = normalized.toLowerCase();
  if (lower === ZERO) return true; // allow zero address unchanged

  try {
    const checksummed = web3.utils.toChecksumAddress(lower);
    return normalized === checksummed;
  } catch (error) {
    return false;
  }
};

const invalidEntries = [];

const filteredTokens = data.tokens.filter((token) => {
  const addressValid = isValidChecksumAddress(token.address);
  const idValid = token.id ? isValidChecksumAddress(token.id) : true;

  const keep = addressValid && idValid;

  if (!keep) {
    invalidEntries.push({
      name: token.name || token.symbol || token.address,
      address: token.address,
      id: token.id,
    });
  }

  return keep;
});

if (invalidEntries.length) {
  console.log(`Removing ${invalidEntries.length} invalid token entries:`);
  invalidEntries.forEach((entry) => {
    console.log(` - ${entry.name || 'Unnamed'} | address: ${entry.address} | id: ${entry.id || 'n/a'}`);
  });
} else {
  console.log('No invalid addresses found.');
}

const nextData = { ...data, tokens: filteredTokens };
fs.writeFileSync(filePath, `${JSON.stringify(nextData, null, 2)}\n`);
console.log(`Updated file written to ${filePath}`);
