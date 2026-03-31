import { useState } from 'react';
import { useHoldings } from './hooks/useHoldings';
import { usePrices } from './hooks/usePrices';
import { Dashboard } from './components/Dashboard';
import { HoldingForm } from './components/HoldingForm';
import { EmptyState } from './components/EmptyState';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardSkeleton } from './components/LoadingSkeleton';
import type { Holding } from './types';

function AppContent() {
  const { data: holdings, isLoading, isError } = useHoldings();
  const hasHoldings = holdings !== undefined && holdings.length > 0;
  const { data: prices, isLoading: pricesLoading, isError: pricesError } = usePrices(hasHoldings);
  const [showForm, setShowForm] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | undefined>();

  function handleAdd() {
    setEditingHolding(undefined);
    setShowForm(true);
  }

  function handleEdit(holding: Holding) {
    setEditingHolding(holding);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingHolding(undefined);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Crypto Portfolio Tracker
          </h1>
          {hasHoldings && (
            <button
              type="button"
              onClick={handleAdd}
              aria-label="Add a new holding"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              + Add Holding
            </button>
          )}
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isLoading && (
          <DashboardSkeleton />
        )}

        {isError && (
          <p className="text-red-600" role="alert">
            Failed to load holdings. Please try again later.
          </p>
        )}

        {holdings && holdings.length === 0 && (
          <EmptyState onAddHolding={handleAdd} />
        )}

        {hasHoldings && (
          <Dashboard
            holdings={holdings}
            prices={prices ?? {}}
            pricesLoading={pricesLoading}
            pricesError={pricesError}
            onEdit={handleEdit}
          />
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400">
        Powered by{' '}
        <a
          href="https://www.coingecko.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          CoinGecko
        </a>
      </footer>

      {showForm && (
        <HoldingForm holding={editingHolding} onClose={handleCloseForm} />
      )}
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
