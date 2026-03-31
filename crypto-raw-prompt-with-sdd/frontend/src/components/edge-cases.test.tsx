import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { HoldingsTable } from './HoldingsTable';
import { SummaryCards } from './SummaryCards';
import { AllocationChart } from './AllocationChart';
import { EmptyState } from './EmptyState';
import { createWrapper } from '../test/wrapper';
import type { Holding, PriceMap } from '../types';

const server = setupServer(
  http.delete('/api/holdings/:id', () => new HttpResponse(null, { status: 204 })),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Edge Cases: Empty Portfolio', () => {
  it('renders empty state with call-to-action', () => {
    const onAdd = vi.fn();
    render(<EmptyState onAddHolding={onAdd} />);

    expect(screen.getByText('No holdings yet')).toBeInTheDocument();
    expect(screen.getByText(/get started/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add holding/i })).toBeInTheDocument();
  });

  it('SummaryCards shows $0.00 for empty holdings', () => {
    render(<SummaryCards holdings={[]} prices={{}} />);

    const zeroValues = screen.getAllByText('$0.00');
    expect(zeroValues.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Edge Cases: Single Holding', () => {
  const singleHolding: Holding[] = [
    {
      id: 'single-1',
      coingeckoId: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      quantity: 1,
      avgPurchasePrice: 30000,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const prices: PriceMap = {
    bitcoin: { usd: 50000, usd24hChange: 5, lastUpdatedAt: 1700000000 },
  };

  it('shows 100% allocation for single holding', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={singleHolding} prices={prices} onEdit={vi.fn()} />
      </Wrapper>,
    );

    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });

  it('shows correct P&L for single holding', () => {
    render(<SummaryCards holdings={singleHolding} prices={prices} />);

    // Cost: 30000, Value: 50000, P&L: +20000
    expect(screen.getByText('+$20,000.00')).toBeInTheDocument();
  });

  it('renders allocation chart with single entry', () => {
    render(<AllocationChart holdings={singleHolding} prices={prices} />);

    const chart = screen.getByRole('img', { name: /allocation/i });
    expect(chart).toBeInTheDocument();
  });
});

describe('Edge Cases: Very Large Values', () => {
  const largeHolding: Holding[] = [
    {
      id: 'large-1',
      coingeckoId: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      quantity: 1000,
      avgPurchasePrice: 50000,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const prices: PriceMap = {
    bitcoin: { usd: 100000, usd24hChange: 10, lastUpdatedAt: 1700000000 },
  };

  it('displays very large USD values correctly', () => {
    render(<SummaryCards holdings={largeHolding} prices={prices} />);

    // Value: 1000 * 100000 = $100,000,000.00
    expect(screen.getByText('$100,000,000.00')).toBeInTheDocument();
  });

  it('displays very large P&L correctly', () => {
    render(<SummaryCards holdings={largeHolding} prices={prices} />);

    // P&L: 100000000 - 50000000 = $50,000,000.00
    expect(screen.getByText('+$50,000,000.00')).toBeInTheDocument();
  });
});

describe('Edge Cases: Very Small Quantities', () => {
  const smallHolding: Holding[] = [
    {
      id: 'small-1',
      coingeckoId: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      quantity: 0.00000001,
      avgPurchasePrice: 50000,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const prices: PriceMap = {
    bitcoin: { usd: 50000, usd24hChange: 0, lastUpdatedAt: 1700000000 },
  };

  it('displays very small quantities with proper formatting', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={smallHolding} prices={prices} onEdit={vi.fn()} />
      </Wrapper>,
    );

    expect(screen.getByText('0.00000001')).toBeInTheDocument();
  });
});

describe('Edge Cases: Holdings with No Prices', () => {
  const holdings: Holding[] = [
    {
      id: 'no-price-1',
      coingeckoId: 'unknown-coin',
      symbol: 'unk',
      name: 'Unknown',
      quantity: 100,
      avgPurchasePrice: 10,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  it('shows dashes for missing price data', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={holdings} prices={{}} onEdit={vi.fn()} />
      </Wrapper>,
    );

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });

  it('shows fallback message in allocation chart when no prices', () => {
    render(<AllocationChart holdings={holdings} prices={{}} />);

    expect(screen.getByText('No price data available for chart')).toBeInTheDocument();
  });
});
