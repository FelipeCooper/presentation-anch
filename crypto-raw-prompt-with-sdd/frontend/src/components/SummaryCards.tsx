import type { Holding, PriceMap } from '../types';
import { formatUSD, formatPercent } from '../utils/format';

interface SummaryCardsProps {
  holdings: Holding[];
  prices: PriceMap;
}

function PnLIndicator({ value }: { value: string }) {
  const isPositive = !value.startsWith('-');
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden="true">{isPositive ? '\u25B2' : '\u25BC'}</span>
      {value}
    </span>
  );
}

export function SummaryCards({ holdings, prices }: SummaryCardsProps) {
  let totalCostBasis = 0;
  let totalCurrentValue = 0;

  for (const holding of holdings) {
    totalCostBasis += holding.quantity * holding.avgPurchasePrice;
    const price = prices[holding.coingeckoId];
    if (price) {
      totalCurrentValue += holding.quantity * price.usd;
    }
  }

  const absolutePnL = totalCurrentValue - totalCostBasis;
  const percentPnL = totalCostBasis > 0 ? (absolutePnL / totalCostBasis) * 100 : 0;
  const isPositive = absolutePnL >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="region" aria-label="Portfolio summary">
      <div className="rounded-lg bg-white p-5 shadow">
        <dt className="text-sm font-medium text-gray-500">Total Value</dt>
        <dd className="mt-1 text-2xl font-semibold text-gray-900">
          {formatUSD(totalCurrentValue)}
        </dd>
      </div>

      <div className="rounded-lg bg-white p-5 shadow">
        <dt className="text-sm font-medium text-gray-500">Cost Basis</dt>
        <dd className="mt-1 text-2xl font-semibold text-gray-900">
          {formatUSD(totalCostBasis)}
        </dd>
      </div>

      <div className="rounded-lg bg-white p-5 shadow">
        <dt className="text-sm font-medium text-gray-500">P&L (USD)</dt>
        <dd
          className={`mt-1 text-2xl font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
          aria-label={`Profit and loss: ${isPositive ? 'gain' : 'loss'} of ${formatUSD(Math.abs(absolutePnL))}`}
        >
          <PnLIndicator
            value={`${isPositive ? '+' : ''}${formatUSD(absolutePnL)}`}
          />
        </dd>
      </div>

      <div className="rounded-lg bg-white p-5 shadow">
        <dt className="text-sm font-medium text-gray-500">P&L (%)</dt>
        <dd
          className={`mt-1 text-2xl font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
          aria-label={`Percentage profit and loss: ${formatPercent(percentPnL)}`}
        >
          <PnLIndicator
            value={formatPercent(percentPnL)}
          />
        </dd>
      </div>
    </div>
  );
}
