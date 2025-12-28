const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'cheese', 'cheeseswap.json');
const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

const prioritySpecs = [
  { name: 'ANY Bitcoin', symbol: 'anyBTC' },
  { name: 'Binance-Peg Ethereum Token', symbol: 'ETH' },
  { name: 'ANY Ethereum', symbol: 'anyETH' },
  { name: 'Binance-Peg BSC-USD', symbol: 'BSC-USD' },
  { name: 'Multichain USDT-ERC20', symbol: 'anyUSDT' },
  { name: 'Binance-Peg XRP Token', symbol: 'XRP' },
  { name: 'Binance-Peg USD Coin', symbol: 'USDC' },
  { name: 'Multichain USDC', symbol: 'anyUSDC' },
  { name: 'TRON', symbol: 'TRX' },
  { name: 'Binance-Peg Dogecoin Token', symbol: 'DOGE' },
  { name: 'Binance-Peg Cardano Token', symbol: 'ADA' },
  { name: 'Binance-Peg Bitcoin Cash Token', symbol: 'BCH' },
  { name: 'Wrapped BTC', symbol: 'WBTC' },
  { name: 'Binance-Peg ChainLink Token', symbol: 'LINK' },
  { name: 'ChainLink-ERC20', symbol: 'anyLINK' },
  { name: 'Binance-Peg Zcash Token', symbol: 'ZEC' },
  { name: 'Stellar', symbol: 'XLM' },
  { name: 'USDe', symbol: 'USDe' },
  { name: 'ANY Litecoin', symbol: 'anyLTC' },
  { name: 'Binance-Peg Litecoin Token', symbol: 'LTC' },
  { name: 'Binance-Peg BTCB Token', symbol: 'BTCB' },
  { name: 'Binance-Peg Avalanche Token', symbol: 'AVAX' },
  { name: 'Binance-Peg Dai Token', symbol: 'DAI' },
  { name: 'DAI-ERC20', symbol: 'anyDAI' },
  { name: 'Binance-Peg Uniswap', symbol: 'UNI' },
  { name: 'Binance-Peg SHIBA INU Token', symbol: 'SHIB' },
  { name: 'Wrapped TON Coin', symbol: 'TONCOIN' },
  { name: 'World Liberty Financial', symbol: 'WLFI' },
  { name: 'Staked USDe', symbol: 'sUSDe' },
  { name: 'Fetch', symbol: 'FET' },
  { name: 'Binance-Peg Polkadot Token', symbol: 'DOT' },
  { name: 'Polkadot Token (Relay Chain)', symbol: 'DOT' },
  { name: 'MemeCore', symbol: 'M' },
  { name: 'Binance-Peg BitTorrent Token', symbol: 'BTT' },
  { name: 'Binance-Peg Aave Token', symbol: 'AAVE' },
  { name: 'Binance-Peg NEAR Protocol', symbol: 'NEAR' },
  { name: 'Binance-Peg Ethereum Classic', symbol: 'ETC' },
  { name: 'Aster', symbol: 'ASTER' },
  { name: 'Pepe', symbol: 'PEPE' },
  { name: 'BlackRock USD Institutional Digital Liquidity Fund', symbol: 'BUIDL' },
  { name: 'Binance-Peg PAX Gold', symbol: 'PAXG' },
  { name: 'ENA', symbol: 'ENA' },
  { name: 'SOLANA', symbol: 'SOL' },
  { name: 'ARB', symbol: 'ARB' },
  { name: 'Binance-Peg Cosmos Token', symbol: 'ATOM' },
  { name: 'Binance-Peg Elrond Token', symbol: 'EGLD' },
  { name: 'Binance-Peg Filecoin', symbol: 'FIL' },
  { name: 'VeChain', symbol: 'VET' },
  { name: 'FunctionBTC', symbol: 'FBTC' },
  { name: 'Solv BTC', symbol: 'SolvBTC' },
  { name: 'Lombard Staked Bitcoin', symbol: 'LBTC' },
  { name: 'Binance-Peg Paxos Standard', symbol: 'PAX' },
  { name: 'Decentralized USD', symbol: 'USDD' },
  { name: 'Decentralized USD', symbol: 'USDD' },
  { name: 'BELDEX', symbol: 'BDX' },
  { name: 'Binance-Peg Synthetix Network Token', symbol: 'SNX' },
  { name: 'MYX', symbol: 'MYX' },
  { name: 'Renzo Restaked ETH', symbol: 'ezETH' },
  { name: 'Venus BTC', symbol: 'vBTC' },
  { name: 'Optimism', symbol: 'OP' },
  { name: 'PancakeSwap Token', symbol: 'CAKE' },
  { name: 'Curve DAO Token', symbol: 'CRV' },
  { name: 'Usual USD', symbol: 'USD0' },
  { name: 'Binance-Peg Tezos Token', symbol: 'XTZ' },
  { name: 'TrueUSD', symbol: 'TUSD' },
  { name: 'ApeCoin', symbol: 'APE' },
  { name: 'MERL', symbol: 'MERL' },
  { name: 'FLOKI', symbol: 'FLOKI' },
  { name: 'BitTorrent', symbol: 'BTT' },
  { name: 'JUST', symbol: 'JST' },
  { name: 'BSC Conflux', symbol: 'bCFX' },
  { name: 'SUN', symbol: 'SUN' },
  { name: 'Trust Wallet', symbol: 'TWT' },
  { name: 'MIOTAC', symbol: 'IOTA' },
  { name: 'APENFT', symbol: 'NFT' },
  { name: 'Binance-Peg APENFT Token', symbol: 'NFT' },
  { name: 'Curve.fi USD Stablecoin', symbol: 'crvUSD' },
  { name: 'Binance-Peg Basic Attention Token', symbol: 'BAT' },
  { name: 'Pendle', symbol: 'PENDLE' },
  { name: 'Binance Beacon ETH', symbol: 'BETH' },
  { name: 'Plasma', symbol: 'XPL' },
  { name: 'Frax Ether', symbol: 'frxETH' },
  { name: 'Frax Ether', symbol: 'frxETH' },
  { name: 'Humanity', symbol: 'H' },
  { name: 'Frax', symbol: 'FRAX' },
  { name: 'Frax', symbol: 'FRAX' },
  { name: 'Binance-Peg Compound Coin', symbol: 'COMP' },
  { name: 'COMP-ERC20', symbol: 'anyCOMP' },
  { name: 'Dexe', symbol: 'DEXE' },
  { name: 'Astherus BNB', symbol: 'asBNB' },
  { name: 'LayerZero', symbol: 'ZRO' },
  { name: 'Venus USDT', symbol: 'vUSDT' },
  { name: 'Decentraland', symbol: 'MANA' },
  { name: 'UndeadServiceToken', symbol: 'UDS' },
  { name: 'RealLink', symbol: 'REAL' },
  { name: 'Falcon Finance', symbol: 'FF' },
  { name: 'AUSD', symbol: 'AUSD' },
  { name: 'Binance-Peg eCash Token', symbol: 'XEC' },
];

const normalize = (value) => (value || '').trim().toLowerCase();

const usedIndices = new Set();
const movedTokens = [];
const missing = [];
const symbolOnlyMatches = [];

const tokens = data.tokens || [];

for (const spec of prioritySpecs) {
  const targetName = normalize(spec.name);
  const targetSymbol = normalize(spec.symbol);

  let matchIndex = tokens.findIndex((token, index) => {
    if (usedIndices.has(index)) return false;
    const nameMatches = normalize(token.name) === targetName;
    const symbolMatches = !targetSymbol || normalize(token.symbol) === targetSymbol;
    return nameMatches && symbolMatches;
  });

  if (matchIndex === -1 && targetSymbol) {
    matchIndex = tokens.findIndex((token, index) => {
      if (usedIndices.has(index)) return false;
      return normalize(token.symbol) === targetSymbol;
    });
    if (matchIndex !== -1) {
      symbolOnlyMatches.push({ spec, matchedName: tokens[matchIndex].name });
    }
  }

  if (matchIndex === -1) {
    missing.push(spec);
    continue;
  }

  usedIndices.add(matchIndex);
  movedTokens.push(tokens[matchIndex]);
}

const remainingTokens = tokens.filter((_, index) => !usedIndices.has(index));
const insertIndex = Math.min(50, remainingTokens.length);
const reorderedTokens = [
  ...remainingTokens.slice(0, insertIndex),
  ...movedTokens,
  ...remainingTokens.slice(insertIndex),
];

const nextData = { ...data, tokens: reorderedTokens };
fs.writeFileSync(filePath, `${JSON.stringify(nextData, null, 2)}\n`);

console.log(`Moved ${movedTokens.length} tokens to position after the top ${insertIndex}.`);

if (symbolOnlyMatches.length) {
  console.log('Matched by symbol only:');
  symbolOnlyMatches.forEach(({ spec, matchedName }) => {
    console.log(` - Spec ${spec.name} (${spec.symbol}) matched token ${matchedName}`);
  });
}

if (missing.length) {
  console.warn('Missing tokens (not moved because they were not found):');
  missing.forEach((spec) => {
    console.warn(` - ${spec.name} (${spec.symbol})`);
  });
}
