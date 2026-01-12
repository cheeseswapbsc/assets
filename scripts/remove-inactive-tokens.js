const fs = require('fs');
const path = require('path');
const fetch = require('cross-fetch');

const STALE_DAYS = Number(process.env.CHEESE_STALE_DAYS || 30);
const RATE_LIMIT_MS = Number(process.env.CHEESE_RATE_LIMIT_MS || 2000);
const MAX_RETRIES = Number(process.env.CHEESE_MAX_RETRIES || 5);
const DRY_RUN = process.argv.includes('--dry-run');
const ETHERSCAN_BASE_URL = process.env.ETHERSCAN_BASE_URL || process.env.BSCSCAN_BASE_URL || 'https://api.etherscan.io/v2/api';
const ETHERSCAN_CHAIN_ID = 56; // BNB Chain
const ETHERSCAN_API_KEY = 'WPH776XEWEB3S8AFR2EX1W4PDGJTREYW9T';
const STALE_SECONDS = STALE_DAYS * 24 * 60 * 60;
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const EXCLUDED_SYMBOLS = new Set([
  'KSHIB',
  'MSHIB',
  'HOTS',
  'CNFT',
  'BLDOGE',
  'DOGEK',
  'PUP',
  'MANGO',
  'KIWI',
  'Cheese-LP',
]);

const EXCLUDED_ADDRESSES = new Set(
  (process.env.CHEESE_SKIP_ADDRESSES || '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c,0x0000000000000000000000000000000000000000,0xaDD8A06fd58761A5047426e160B2B88AD3B9D464')
    .split(',')
    .map((addr) => addr.trim().toLowerCase())
    .filter(Boolean)
);

const FILE_PATH = path.join(__dirname, '..', 'cheese', 'cheeseswap.json');
const TEMP_PATH = path.join(__dirname, 'inactive-token-temp.json');
let lastHttpCall = 0;

const readJson = () => JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
const writeJson = (data) => fs.writeFileSync(FILE_PATH, `${JSON.stringify(data, null, 2)}\n`);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRateLimit(action) {
  const now = Date.now();
  const wait = Math.max(0, RATE_LIMIT_MS - (now - lastHttpCall));
  if (wait > 0) {
    await delay(wait);
  }
  lastHttpCall = Date.now();
  return action();
}

function buildLogsUrl(address) {
  const params = new URLSearchParams({
    action: 'getLogs',
    chainid: String(ETHERSCAN_CHAIN_ID),
    address,
    topic0: TRANSFER_TOPIC,
    page: '1',
    offset: '1',
    sort: 'desc',
  });

  params.set('apikey', ETHERSCAN_API_KEY);

  return `${ETHERSCAN_BASE_URL}?${params.toString()}`;
}

async function fetchLastTransferTimestamp(address) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await withRateLimit(() => fetch(buildLogsUrl(address)));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      if (payload.status !== '1') {
        const message = String(payload.result || payload.message || 'unknown error');
        if (message.toLowerCase().includes('no transactions')) {
          return null;
        }
        throw new Error(message);
      }

      const latestTx = Array.isArray(payload.result) ? payload.result[0] : null;
      if (!latestTx) {
        return null;
      }

      const ts = Number(latestTx.timeStamp);
      if (Number.isFinite(ts)) {
        return ts;
      }

      throw new Error('Invalid timestamp in response');
    } catch (error) {
      console.error(`Failed to fetch logs for ${address} (attempt ${attempt}): ${error.message}`);
      if (attempt >= MAX_RETRIES) {
        console.error(`Giving up on ${address} after ${attempt} attempts.`);
        return null;
      }
      await delay(RATE_LIMIT_MS * attempt);
    }
  }

  return null;
}

async function evaluateToken(token, nowSeconds) {
  if (!token || typeof token.symbol !== 'string') {
    return { keep: true };
  }

  if (EXCLUDED_SYMBOLS.has(token.symbol)) {
    return { keep: true, reason: 'excluded' };
  }

  if (token.address && EXCLUDED_ADDRESSES.has(token.address.toLowerCase())) {
    return { keep: true, reason: 'excluded-address' };
  }

  if (!token.address) {
    return { keep: true, reason: 'missing-address' };
  }

  const lastTimestamp = await fetchLastTransferTimestamp(token.address);
  if (!lastTimestamp) {
    return { keep: false, reason: 'no-activity' };
  }

  const inactive = nowSeconds - lastTimestamp > STALE_SECONDS;
  return {
    keep: !inactive,
    lastTimestamp,
    reason: inactive ? 'stale' : 'recent',
  };
}

async function run() {
  const data = readJson();
  const tokens = Array.isArray(data.tokens) ? data.tokens : [];
  const nowSeconds = Math.floor(Date.now() / 1000);

  const kept = [];
  const removed = [];

  for (const token of tokens) {
    try {
      const result = await evaluateToken(token, nowSeconds);
      if (result.keep) {
        kept.push(token);
      } else {
        removed.push({
          symbol: token.symbol,
          name: token.name,
          address: token.address,
          reason: result.reason,
          lastSeen: result.lastTimestamp ? new Date(result.lastTimestamp * 1000).toISOString() : 'unknown',
        });
        console.log(`Marking ${token.symbol || token.address} (${result.reason})`);
      }
    } catch (error) {
      console.error(`Error while evaluating ${token.symbol || token.address}:`, error.message);
      kept.push(token);
    }
  }

  const tempPayload = {
    generatedAt: new Date().toISOString(),
    staleDays: STALE_DAYS,
    dataSource: 'Etherscan/BscScan getLogs v2',
    apiEndpoint: ETHERSCAN_BASE_URL,
    removed,
  };
  fs.writeFileSync(TEMP_PATH, `${JSON.stringify(tempPayload, null, 2)}\n`);
  console.log(`Temp removal list written to ${TEMP_PATH}`);

  console.log(`Processed ${tokens.length} tokens, removed ${removed.length}, kept ${kept.length}.`);

  if (DRY_RUN || removed.length === 0) {
    console.log(DRY_RUN ? 'Dry-run mode enabled; no file changes written.' : 'No tokens marked for removal.');
    return;
  }

  const latestData = readJson();
  const removalSet = new Set(removed.map((entry) => (entry.address || '').toLowerCase()));
  const filteredTokens = latestData.tokens.filter((token) => !removalSet.has((token.address || '').toLowerCase()));

  writeJson({ ...latestData, tokens: filteredTokens });
  console.log(`Removed ${removed.length} tokens from ${FILE_PATH}`);
}

run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
