import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Dashboard } from './Dashboard';
import { createWrapper } from '../test/wrapper';
import type { Holding, PriceMap } from '../types';

// Mock Recharts to avoid JSDOM rendering issues
vi.mock('recharts', () => {
  const MockResponsiveContainer = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  );
  const MockPieChart = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  );
  const MockPie = ({ children, data }: { children: React.ReactNode; data: Array<{ name: string }> }) => (
    <div data-testid="pie">
      {data.map((entry) => (
        <span key={entry.name}>{entry.name}</span>
      ))}
      {children}
    </div>
  );
  const MockCell = () => <div />;
  const MockTooltip = () => <div />;
  const MockLegend = () => <div />;

  return {
    ResponsiveContainer: MockResponsiveContainer,
    PieChart: MockPieChart,
    Pie: MockPie,
    Cell: MockCell,
    Tooltip: MockTooltip,
    Legend: MockLegend,
  };
});

const mockHoldings: Holding[] = [
  {
    id: 'abc-123',
    coingeckoId: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    quantity: 1.5,
    avgPurchasePrice: 40000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockPrices: PriceMap = {
  bitcoin: { usd: 50000, usd24hChange: 2.5, lastUpdatedAt: 1700000000 },
};

const server = setupServer(
  http.delete('/api/holdings/:id', () => new HttpResponse(null, { status: 204 })),
  http.get('/api/holdings', () => HttpResponse.json(mockHoldings)),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Dashboard', () => {
  it('renders summary cards, holdings table, and allocation chart', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <Dashboard
          holdings={mockHoldings}
          prices={mockPrices}
          pricesLoading={false}
          pricesError={false}
          onEdit={vi.fn()}
        />
      </Wrapper>,
    );

    // Summary cards
    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('Cost Basis')).toBeInTheDocument();

    // Allocation section heading
    expect(screen.getByRole('heading', { name: 'Allocation' })).toBeInTheDocument();

    // Holdings table renders asset
    expect(screen.getAllByText('Bitcoin').length).toBeGreaterThanOrEqual(1);
  });

  it('shows error banner when prices fail to load', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <Dashboard
          holdings={mockHoldings}
          prices={{}}
          pricesLoading={false}
          pricesError={true}
          onEdit={vi.fn()}
        />
      </Wrapper>,
    );

    expect(
      screen.getByText('Unable to fetch latest prices. Displaying last known data.'),
    ).toBeInTheDocument();
  });

  it('shows loading indicator when prices are loading with no cached data', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <Dashboard
          holdings={mockHoldings}
          prices={{}}
          pricesLoading={true}
          pricesError={false}
          onEdit={vi.fn()}
        />
      </Wrapper>,
    );

    expect(screen.getByText('Fetching live prices...')).toBeInTheDocument();
  });

  it('does not show loading indicator when cached prices exist', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <Dashboard
          holdings={mockHoldings}
          prices={mockPrices}
          pricesLoading={true}
          pricesError={false}
          onEdit={vi.fn()}
        />
      </Wrapper>,
    );

    expect(screen.queryByText('Fetching live prices...')).not.toBeInTheDocument();
  });
});
