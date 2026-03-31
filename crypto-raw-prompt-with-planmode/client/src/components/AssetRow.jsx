const fmtCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const fmtQty = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

function AssetRow({ asset }) {
  const changeClass = asset.priceChange24h >= 0 ? "positive" : "negative";
  const pnlClass = asset.pnl >= 0 ? "positive" : "negative";

  return (
    <tr>
      <td className="asset-name-cell">
        <img src={asset.image} alt={asset.name} className="asset-icon" />
        <div>
          <div className="asset-name">{asset.name}</div>
          <div className="asset-symbol">{asset.symbol.toUpperCase()}</div>
        </div>
      </td>
      <td>{fmtCurrency.format(asset.currentPrice)}</td>
      <td className={changeClass}>
        {asset.priceChange24h >= 0 ? "+" : ""}
        {asset.priceChange24h?.toFixed(2)}%
      </td>
      <td>{fmtQty.format(asset.quantity)}</td>
      <td>{fmtCurrency.format(asset.currentValue)}</td>
      <td className={pnlClass}>
        <div>{fmtCurrency.format(asset.pnl)}</div>
        <div className="pnl-row-percent">
          {asset.pnl >= 0 ? "+" : ""}
          {asset.pnlPercent.toFixed(2)}%
        </div>
      </td>
    </tr>
  );
}

export default AssetRow;
