const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'cheese', 'cheeseswap.json');
const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

const allowed = new Set(['coinmarketcap', 'x', 'telegram', 'discord', 'github']);

const filterLinks = (links) => {
  if (!Array.isArray(links)) return undefined;
  const filtered = links.filter((link) => {
    if (!link || typeof link !== 'object') return false;
    const name = (link.name || '').toLowerCase();
    return allowed.has(name);
  });
  return filtered.length ? filtered : undefined;
};

const updatedTokens = data.tokens.map((token) => {
  if (!token.links) return token;
  const filteredLinks = filterLinks(token.links);
  if (!filteredLinks) {
    const { links, ...rest } = token;
    return rest;
  }
  return { ...token, links: filteredLinks };
});

const nextData = { ...data, tokens: updatedTokens };
fs.writeFileSync(filePath, `${JSON.stringify(nextData, null, 2)}\n`);
console.log(`Links filtered to allowed names in ${filePath}`);
