import type { Holding, PriceMap } from '../types';
import { useDeleteHolding } from '../hooks/useHoldings';
import { useState } from 'react';
import { formatUSD, formatCrypto, formatPercent } from '../utils/format';

interface HoldingsTableProps {
  holdings: Holding[];
  prices: PriceMap;
  onEdit: (holding: Holding) => void;
}

export function HoldingsTable({ holdings, prices, onEdit }: HoldingsTableProps) {
  const deleteMutation = useDeleteHolding();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  let totalCurrentValue = 0;
  for (const holding of holdings) {
    const price = prices[holding.coingeckoId];
    if (price) {
      totalCurrentValue += holding.quantity * price.usd;
    }
  }

  async function handleDelete(holding: Holding) {
    if (!window.confirm(`Delete ${holding.name} holding?`)) return;

    setDeletingId(holding.id);
    try {
      await deleteMutation.mutateAsync(holding.id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="overflow-x-auto" role="region" aria-label="Holdings table" tabIndex={0}>
      <table className="min-w-full divide-y divide-gray-200">
        <caption className="sr-only">Portfolio holdings with prices, allocation, and profit/loss</caption>
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Asset
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Quantity
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Avg. Price
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Current Price
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Current Value
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Allocation
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              P&L
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {holdings.map((holding) => {
            const price = prices[holding.coingeckoId];
            const costBasis = holding.quantity * holding.avgPurchasePrice;
            const currentValue = price ? holding.quantity * price.usd : 0;
            const pnl = price ? currentValue - costBasis : 0;
            const pnlPercent = costBasis > 0 && price ? (pnl / costBasis) * 100 : 0;
            const allocation = totalCurrentValue > 0 && price ? (currentValue / totalCurrentValue) * 100 : 0;
            const isPositive = pnl >= 0;
            const change24h = price?.usd24hChange;

            return (
              <tr key={holding.id}>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {holding.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {holding.symbol.toUpperCase()}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                  {formatCrypto(holding.quantity)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                  {formatUSD(holding.avgPurchasePrice)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  {price ? (
                    <div>
                      <div className="text-gray-900">{formatUSD(price.usd)}</div>
                      {change24h !== undefined && (
                        <div
                          className={`text-xs ${change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          aria-label={`24 hour change: ${formatPercent(change24h)}`}
                        >
                          <span aria-hidden="true">{change24h >= 0 ? '\u25B2' : '\u25BC'}</span>{' '}
                          {formatPercent(change24h)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">&mdash;</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                  {price ? formatUSD(currentValue) : <span className="text-gray-400">&mdash;</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                  {price ? `${allocation.toFixed(1)}%` : <span className="text-gray-400">&mdash;</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  {price ? (
                    <div aria-label={`Profit and loss: ${isPositive ? 'gain' : 'loss'} ${formatUSD(Math.abs(pnl))}, ${formatPercent(pnlPercent)}`}>
                      <div className={isPositive ? 'text-green-600' : 'text-red-600'}>
                        <span aria-hidden="true">{isPositive ? '\u25B2' : '\u25BC'}</span>{' '}
                        {isPositive ? '+' : ''}{formatUSD(pnl)}
                      </div>
                      <div className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(pnlPercent)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">&mdash;</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  <button
                    type="button"
                    onClick={() => onEdit(holding)}
                    aria-label={`Edit ${holding.name} holding`}
                    className="mr-2 text-indigo-600 hover:text-indigo-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(holding)}
                    disabled={deletingId === holding.id}
                    aria-label={`Delete ${holding.name} holding`}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  >
                    {deletingId === holding.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
