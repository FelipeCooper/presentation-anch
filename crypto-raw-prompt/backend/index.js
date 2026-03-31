const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// In-memory portfolio store (seed with some default holdings)
let portfolio = [
  { id: "bitcoin", symbol: "BTC", amount: 0.5, avgBuyPrice: 30000 },
  { id: "ethereum", symbol: "ETH", amount: 4, avgBuyPrice: 1800 },
  { id: "solana", symbol: "SOL", amount: 50, avgBuyPrice: 25 },
  { id: "cardano", symbol: "ADA", amount: 5000, avgBuyPrice: 0.35 },
  { id: "ripple", symbol: "XRP", amount: 2000, avgBuyPrice: 0.5 },
];

// Fetch current prices from CoinGecko
async function fetchPrices(ids) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  return res.json();
}

// GET /api/portfolio — returns portfolio with live prices and P&L
app.get("/api/portfolio", async (req, res) => {
  try {
    const ids = portfolio.map((a) => a.id);
    const prices = await fetchPrices(ids);

    const assets = portfolio.map((asset) => {
      const priceData = prices[asset.id] || {};
      const currentPrice = priceData.usd || 0;
      const change24h = priceData.usd_24h_change || 0;
      const currentValue = currentPrice * asset.amount;
      const costBasis = asset.avgBuyPrice * asset.amount;
      const pnl = currentValue - costBasis;
      const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

      return {
        ...asset,
        currentPrice,
        change24h,
        currentValue,
        costBasis,
        pnl,
        pnlPercent,
      };
    });

    const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);
    const totalCost = assets.reduce((sum, a) => sum + a.costBasis, 0);
    const totalPnl = totalValue - totalCost;
    const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    // Add allocation percentage
    const assetsWithAllocation = assets.map((a) => ({
      ...a,
      allocation: totalValue > 0 ? (a.currentValue / totalValue) * 100 : 0,
    }));

    res.json({
      assets: assetsWithAllocation,
      summary: { totalValue, totalCost, totalPnl, totalPnlPercent },
    });
  } catch (err) {
    console.error("Error fetching portfolio:", err.message);
    res.status(500).json({ error: "Failed to fetch portfolio data" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
