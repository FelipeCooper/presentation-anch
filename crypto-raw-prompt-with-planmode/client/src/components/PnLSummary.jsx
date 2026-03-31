const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function PnLSummary({ summary }) {
  const { totalPnl, totalPnlPercent, totalCost } = summary;
  const isPositive = totalPnl >= 0;

  return (
    <div className={`card pnl-summary ${isPositive ? "positive" : "negative"}`}>
      <h2>Overall P&L</h2>
      <div className="pnl-value">{fmt.format(totalPnl)}</div>
      <div className="pnl-percent">
        {isPositive ? "+" : ""}
        {totalPnlPercent.toFixed(2)}%
      </div>
      <div className="pnl-cost">Cost Basis: {fmt.format(totalCost)}</div>
    </div>
  );
}

export default PnLSummary;
