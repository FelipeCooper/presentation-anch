const COLORS = ["#f7931a", "#627eea", "#9945ff", "#0033ad", "#e6007a"];

function Allocation({ assets }) {
  return (
    <div className="card allocation">
      <h2>Allocation</h2>
      <div className="allocation-bar">
        {assets.map((asset, i) => (
          <div
            key={asset.id}
            className="allocation-segment"
            style={{
              width: `${asset.allocationPercent}%`,
              backgroundColor: COLORS[i % COLORS.length],
            }}
            title={`${asset.name}: ${asset.allocationPercent.toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="allocation-legend">
        {assets.map((asset, i) => (
          <div key={asset.id} className="legend-item">
            <span
              className="legend-dot"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="legend-name">{asset.symbol.toUpperCase()}</span>
            <span className="legend-pct">
              {asset.allocationPercent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Allocation;
