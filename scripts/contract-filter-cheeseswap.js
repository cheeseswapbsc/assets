const fs = require('fs');
const path = require('path');
const Web3 = require('web3');

const rpcUrl = process.env.BSC_RPC || 'https://bsc-dataseed.binance.org/';
const web3 = new Web3(rpcUrl);
const filePath = path.join(__dirname, '..', 'cheese', 'cheeseswap.json');

const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

const ZERO = '0x0000000000000000000000000000000000000000';

const chunk = (array, size) => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

const isContract = async (address) => {
  if (typeof address !== 'string') return false;
  const normalized = address.trim();
  if (!normalized.startsWith('0x') || normalized.length !== 42) return false;
  if (normalized === ZERO) return false; // zero address is not a contract

  try {
    const code = await web3.eth.getCode(normalized);
    return code && code !== '0x' && code !== '0x0';
  } catch (error) {
    console.warn(`RPC error for ${normalized}: ${error.message}`);
    return true; // keep entry on RPC error to avoid accidental removal
  }
};

const invalid = [];
const kept = [];

const run = async () => {
  const groups = chunk(data.tokens, 5); // small parallel batches to avoid rate limits

  for (const group of groups) {
    const results = await Promise.all(
      group.map(async (token) => {
        const addrIsContract = await isContract(token.address);
        const idIsContract = token.id ? await isContract(token.id) : true;
        const keep = addrIsContract && idIsContract;

        if (!keep) {
          invalid.push({
            name: token.name || token.symbol || token.address,
            address: token.address,
            id: token.id,
          });
        }

        return keep ? token : null;
      })
    );

    results.forEach((token) => {
      if (token) kept.push(token);
    });
  }

  if (invalid.length) {
    console.log(`Removing ${invalid.length} non-contract token entries:`);
    invalid.forEach((entry) => {
      console.log(` - ${entry.name || 'Unnamed'} | address: ${entry.address} | id: ${entry.id || 'n/a'}`);
    });
  } else {
    console.log('All entries are contract addresses.');
  }

  const nextData = { ...data, tokens: kept };
  fs.writeFileSync(filePath, `${JSON.stringify(nextData, null, 2)}\n`);
  console.log(`Updated file written to ${filePath}`);
};

run();
