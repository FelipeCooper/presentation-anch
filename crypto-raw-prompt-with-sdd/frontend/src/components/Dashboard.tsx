import type { Holding, PriceMap } from '../types';
import { SummaryCards } from './SummaryCards';
import { AllocationChart } from './AllocationChart';
import { HoldingsTable } from './HoldingsTable';

interface DashboardProps {
  holdings: Holding[];
  prices: PriceMap;
  pricesLoading: boolean;
  pricesError: boolean;
  onEdit: (holding: Holding) => void;
}

export function Dashboard({ holdings, prices, pricesLoading, pricesError, onEdit }: DashboardProps) {
  return (
    <div className="space-y-6">
      {pricesError && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4" role="alert">
          <p className="text-sm text-yellow-800">
            Unable to fetch latest prices. Displaying last known data.
          </p>
        </div>
      )}

      {pricesLoading && Object.keys(prices).length === 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500" role="status">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Fetching live prices...
        </div>
      )}

      <SummaryCards holdings={holdings} prices={prices} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3 min-w-0 rounded-lg bg-white shadow">
          <HoldingsTable holdings={holdings} prices={prices} onEdit={onEdit} />
        </div>
        <div className="rounded-lg bg-white p-5 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Allocation</h2>
          <AllocationChart holdings={holdings} prices={prices} />
        </div>
      </div>
    </div>
  );
}
