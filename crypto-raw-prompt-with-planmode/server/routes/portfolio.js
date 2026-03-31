const express = require("express");
const { fetchMarketData } = require("../services/coingecko");
const holdings = require("../data/portfolio.json");

const router = express.Router();

router.get("/portfolio", async (req, res) => {
  try {
    const coinIds = holdings.map((h) => h.id);
    const marketData = await fetchMarketData(coinIds);

    const priceMap = {};
    for (const coin of marketData) {
      priceMap[coin.id] = coin;
    }

    let totalValue = 0;
    let totalCost = 0;

    const assets = holdings
      .map((h) => {
        const market = priceMap[h.id];
        if (!market) return null;

        const currentValue = market.current_price * h.quantity;
        const costTotal = h.costBasis * h.quantity;
        const pnl = currentValue - costTotal;
        const pnlPercent = costTotal > 0 ? (pnl / costTotal) * 100 : 0;

        totalValue += currentValue;
        totalCost += costTotal;

        return {
          id: h.id,
          symbol: h.symbol,
          name: h.name,
          image: market.image,
          quantity: h.quantity,
          costBasis: h.costBasis,
          currentPrice: market.current_price,
          currentValue,
          costTotal,
          pnl,
          pnlPercent,
          priceChange24h: market.price_change_percentage_24h,
        };
      })
      .filter(Boolean);

    for (const asset of assets) {
      asset.allocationPercent =
        totalValue > 0 ? (asset.currentValue / totalValue) * 100 : 0;
    }

    const totalPnl = totalValue - totalCost;
    const totalPnlPercent =
      totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    res.json({
      assets,
      summary: {
        totalValue,
        totalCost,
        totalPnl,
        totalPnlPercent,
      },
    });
  } catch (err) {
    console.error("Portfolio error:", err.message);
    res.status(502).json({ error: "Unable to fetch portfolio data" });
  }
});

module.exports = router;
