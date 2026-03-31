let cache = { data: null, timestamp: 0 };
const CACHE_TTL = 60000;

async function fetchMarketData(coinIds) {
  const now = Date.now();
  if (cache.data && now - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const ids = coinIds.join(",");
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc`;

  const res = await fetch(url);
  if (!res.ok) {
    if (cache.data) return cache.data;
    throw new Error(`CoinGecko API error: ${res.status}`);
  }

  const data = await res.json();
  cache = { data, timestamp: now };
  return data;
}

module.exports = { fetchMarketData };
