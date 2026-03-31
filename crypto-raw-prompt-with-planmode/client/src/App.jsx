import { useState, useEffect } from "react";
import Header from "./components/Header";
import PnLSummary from "./components/PnLSummary";
import Allocation from "./components/Allocation";
import AssetTable from "./components/AssetTable";

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchPortfolio() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio");
      if (!res.ok) throw new Error("Failed to fetch portfolio");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPortfolio();
  }, []);

  if (loading) {
    return (
      <div className="app">
        <Header />
        <div className="loading">Loading portfolio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <Header />
        <div className="error">
          <p>{error}</p>
          <button onClick={fetchPortfolio}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header totalValue={data.summary.totalValue} />
      <div className="dashboard">
        <PnLSummary summary={data.summary} />
        <Allocation assets={data.assets} />
      </div>
      <AssetTable assets={data.assets} />
      <button className="refresh-btn" onClick={fetchPortfolio}>
        Refresh Prices
      </button>
    </div>
  );
}

export default App;
