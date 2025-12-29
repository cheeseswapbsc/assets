const fs = require('fs');
const path = require('path');
const Web3 = require('web3');

const RPC_URL = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
const LOOKBACK_WINDOW = Number(process.env.CHEESE_BLOCK_WINDOW || 5000);
const MAX_LOOKBACK = Number(process.env.CHEESE_MAX_LOOKBACK || 500000);
const STALE_DAYS = Number(process.env.CHEESE_STALE_DAYS || 30);
const CONCURRENCY = Number(process.env.CHEESE_CONCURRENCY || 3);
const DRY_RUN = process.argv.includes('--dry-run');

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

const FILE_PATH = path.join(__dirname, '..', 'cheese', 'cheeseswap.json');
const TRANSFER_TOPIC = Web3.utils.sha3('Transfer(address,address,uint256)');
const STALE_SECONDS = STALE_DAYS * 24 * 60 * 60;

const web3 = new Web3(RPC_URL);
const blockTimestampCache = new Map();

const readJson = () => JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
const writeJson = (data) => fs.writeFileSync(FILE_PATH, `${JSON.stringify(data, null, 2)}\n`);

async function getBlockTimestamp(blockNumber) {
  if (blockTimestampCache.has(blockNumber)) {
    return blockTimestampCache.get(blockNumber);
  }
  const block = await web3.eth.getBlock(blockNumber);
  if (!block) return null;
  const ts = Number(block.timestamp);
  blockTimestampCache.set(blockNumber, ts);
  return ts;
}

async function findLastTransferTimestamp(address, latestBlock) {
  let toBlock = latestBlock;
  let scanned = 0;

  while (toBlock >= 0 && scanned <= MAX_LOOKBACK) {
    const fromBlock = Math.max(0, toBlock - LOOKBACK_WINDOW + 1);

    try {
      const logs = await web3.eth.getPastLogs({
        address,
        topics: [TRANSFER_TOPIC],
        fromBlock,
        toBlock,
      });

      if (logs.length) {
        const lastLog = logs[logs.length - 1];
        const blockNumber = Number(lastLog.blockNumber);
        return getBlockTimestamp(blockNumber);
      }
    } catch (error) {
      console.error(`Failed to fetch logs for ${address} (${fromBlock}-${toBlock}):`, error.message);
      return null;
    }

    const covered = toBlock - fromBlock + 1;
    scanned += covered;
    toBlock = fromBlock - 1;
  }

  return null;
}

async function evaluateToken(token, latestBlock, nowSeconds) {
  if (!token || typeof token.symbol !== 'string') {
    return { keep: true };
  }

  if (EXCLUDED_SYMBOLS.has(token.symbol)) {
    return { keep: true, reason: 'excluded' };
  }

  const lastTimestamp = await findLastTransferTimestamp(token.address, latestBlock);
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
  const latestBlock = await web3.eth.getBlockNumber();
  const nowSeconds = Math.floor(Date.now() / 1000);

  const kept = [];
  const removed = [];

  let index = 0;

  async function worker() {
    while (index < tokens.length) {
      const currentIndex = index;
      index += 1;
      const token = tokens[currentIndex];

      try {
        const result = await evaluateToken(token, latestBlock, nowSeconds);
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
          console.log(`Removing ${token.symbol || token.address} (${result.reason})`);
        }
      } catch (error) {
        console.error(`Error while evaluating ${token.symbol || token.address}:`, error.message);
        kept.push(token);
      }
    }
  }

  const workers = Array.from({ length: Math.max(1, CONCURRENCY) }, () => worker());
  await Promise.all(workers);

  console.log(`Processed ${tokens.length} tokens, removed ${removed.length}, kept ${kept.length}.`);

  if (!DRY_RUN) {
    const nextData = { ...data, tokens: kept };
    writeJson(nextData);
    console.log(`Updated file written to ${FILE_PATH}`);
  } else {
    console.log('Dry-run mode enabled; no file changes written.');
  }

  if (removed.length) {
    const summaryPath = path.join(__dirname, '..', 'scripts', 'inactive-token-report.json');
    fs.writeFileSync(summaryPath, `${JSON.stringify(removed, null, 2)}\n`);
    console.log(`Removed token summary saved to ${summaryPath}`);
  }
}

run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
