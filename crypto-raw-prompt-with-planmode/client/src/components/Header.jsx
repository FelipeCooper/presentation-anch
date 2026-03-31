const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function Header({ totalValue }) {
  return (
    <header className="header">
      <h1>Crypto Portfolio Tracker</h1>
      {totalValue != null && (
        <div className="total-value">
          <span className="label">Portfolio Value</span>
          <span className="value">{fmt.format(totalValue)}</span>
        </div>
      )}
    </header>
  );
}

export default Header;
