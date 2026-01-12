# assets
CheeseSwap listed tokens

## Scripts

### remove-inactive-tokens.js
- Uses the latest Etherscan v2 format (e.g. `https://api.etherscan.io/v2/api?action=getLogs&chainid=56&...`) to pull the most recent `Transfer` event for every listed token. BscScan-compatible endpoints also work if you override the base URL.
- The script currently embeds the provided API key (`WPH776XEWEB3S8AFR2EX1W4PDGJTREYW9T`) per request requirements.
- Configure environment variables before running:
    - `ETHERSCAN_BASE_URL` if you need to point at a different compatible explorer (defaults to the provided v2 API endpoint).
    - `CHEESE_STALE_DAYS` to control the inactivity threshold (default 30 days).
    - `CHEESE_RATE_LIMIT_MS` / `CHEESE_MAX_RETRIES` to tune request pacing and retry handling.
    - `CHEESE_SKIP_ADDRESSES` for a comma-separated allowlist of tokens that should never be removed.
- Run with `node scripts/remove-inactive-tokens.js --dry-run` to preview removals without updating `cheese/cheeseswap.json`.
