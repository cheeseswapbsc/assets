#!/usr/bin/env node
/*
 * Utility script that uses web3 v5 to query ERC-20 metadata (symbol, decimals, name)
 * for one or more Binance Smart Chain token contracts. It relies on either the
 * BSC_RPC_URL environment variable or the --rpc flag for connectivity and accepts
 * contract addresses as positional arguments or via a newline-delimited file.
 */
const fs = require('fs');
const path = require('path');
const Web3 = require('web3');

const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  }
];

function usage() {
  const script = path.basename(__filename);
  console.error(`Usage: node ${script} [--rpc https://bsc-rpc-url] [--file addresses.txt] <address> ...`);
  console.error('  --rpc   Optional RPC URL (falls back to BSC_RPC_URL env variable)');
  console.error('  --file  Optional newline-delimited list of addresses');
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let rpcUrl = process.env.BSC_RPC_URL;
  let filePath;
  const addresses = [];

  while (args.length) {
    const arg = args.shift();
    if (arg === '--rpc') {
      rpcUrl = args.shift();
    } else if (arg === '--file') {
      filePath = args.shift();
    } else if (arg === '--help' || arg === '-h') {
      usage();
    } else {
      addresses.push(arg);
    }
  }

  if (!rpcUrl) {
    console.error('Missing RPC URL. Provide --rpc or set BSC_RPC_URL.');
    usage();
  }

  if (filePath) {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    fileContents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((addr) => addresses.push(addr));
  }

  if (!addresses.length) {
    console.error('Provide at least one contract address via args or --file.');
    usage();
  }

  return { rpcUrl, addresses };
}

function sanitizeAddress(address) {
  if (!address) {
    throw new Error('Empty address provided.');
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  return address;
}

function cleanString(value, web3) {
  if (typeof value === 'string') {
    return value.replace(/\u0000/g, '').trim();
  }
  if (value && value.startsWith && value.startsWith('0x')) {
    try {
      return web3.utils.hexToUtf8(value).replace(/\u0000/g, '').trim();
    } catch (_) {
      return value;
    }
  }
  return value;
}

async function fetchTokenMetadata(web3, address) {
  const contract = new web3.eth.Contract(ERC20_ABI, address);
  const result = { address };

  const [symbol, decimals, name] = await Promise.all([
    contract.methods.symbol().call().catch((err) => {
      throw new Error(`symbol() failed: ${err.message}`);
    }),
    contract.methods.decimals().call().catch((err) => {
      throw new Error(`decimals() failed: ${err.message}`);
    }),
    contract.methods.name().call().catch((err) => {
      throw new Error(`name() failed: ${err.message}`);
    })
  ]);

  result.symbol = cleanString(symbol, web3);
  result.decimals = Number(decimals);
  result.name = cleanString(name, web3);

  return result;
}

(async () => {
  const { rpcUrl, addresses } = parseArgs();
  const web3 = new Web3(rpcUrl);

  const uniqueAddresses = Array.from(
    new Set(addresses.map((addr) => sanitizeAddress(Web3.utils.toChecksumAddress(addr))))
  );

  const results = [];
  for (const address of uniqueAddresses) {
    process.stderr.write(`Fetching ${address}... `);
    try {
      const data = await fetchTokenMetadata(web3, address);
      results.push(data);
      process.stderr.write('done\n');
    } catch (err) {
      process.stderr.write('failed\n');
      console.error(`  ${err.message}`);
    }
  }

  process.stderr.write(`\nFetched token metadata for ${results.length} contracts.\n`);
  process.stdout.write(JSON.stringify(results, null, 2));
  process.stdout.write('\n');
})();
