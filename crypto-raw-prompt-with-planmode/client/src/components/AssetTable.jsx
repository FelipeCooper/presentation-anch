import AssetRow from "./AssetRow";

function AssetTable({ assets }) {
  return (
    <div className="card asset-table-wrapper">
      <h2>Assets</h2>
      <table className="asset-table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Price</th>
            <th>24h</th>
            <th>Quantity</th>
            <th>Value</th>
            <th>P&L</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <AssetRow key={asset.id} asset={asset} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AssetTable;
