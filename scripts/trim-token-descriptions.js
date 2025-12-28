const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'cheese', 'cheeseswap.json');
const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

const WORD_LIMIT = 20;

const trimDescription = (description) => {
  if (!description || typeof description !== 'string') return description;
  const words = description.trim().split(/\s+/);
  if (words.length <= WORD_LIMIT) return description.trim();
  return words.slice(0, WORD_LIMIT).join(' ');
};

const updatedTokens = data.tokens.map((token) => {
  if (!token.description) return token;
  return { ...token, description: trimDescription(token.description) };
});

const nextData = { ...data, tokens: updatedTokens };
fs.writeFileSync(filePath, `${JSON.stringify(nextData, null, 2)}\n`);
console.log(`Descriptions trimmed to ${WORD_LIMIT} words (where needed) in ${filePath}`);
