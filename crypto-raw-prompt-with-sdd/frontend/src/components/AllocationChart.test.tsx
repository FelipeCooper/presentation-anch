import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AllocationChart } from './AllocationChart';
import type { Holding, PriceMap } from '../types';

// Mock Recharts to avoid rendering issues in JSDOM
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
        <span key={entry.name} data-testid={`pie-entry-${entry.name}`}>
          {entry.name}
        </span>
      ))}
      {children}
    </div>
  );
  const MockCell = () => <div data-testid="cell" />;
  const MockTooltip = () => <div data-testid="tooltip" />;
  const MockLegend = () => <div data-testid="legend" />;

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
  {
    id: 'def-456',
    coingeckoId: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    quantity: 10,
    avgPurchasePrice: 2000,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

const mockPrices: PriceMap = {
  bitcoin: { usd: 50000, usd24hChange: 2.5, lastUpdatedAt: 1700000000 },
  ethereum: { usd: 3000, usd24hChange: -1.2, lastUpdatedAt: 1700000000 },
};

describe('AllocationChart', () => {
  it('renders chart with holding entries', () => {
    render(<AllocationChart holdings={mockHoldings} prices={mockPrices} />);

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-entry-Bitcoin')).toBeInTheDocument();
    expect(screen.getByTestId('pie-entry-Ethereum')).toBeInTheDocument();
  });

  it('has accessible role and label', () => {
    render(<AllocationChart holdings={mockHoldings} prices={mockPrices} />);

    expect(screen.getByRole('img', { name: /portfolio allocation donut chart/i })).toBeInTheDocument();
  });

  it('shows fallback message when no prices available', () => {
    render(<AllocationChart holdings={mockHoldings} prices={{}} />);

    expect(screen.getByText('No price data available for chart')).toBeInTheDocument();
  });

  it('renders responsive container', () => {
    render(<AllocationChart holdings={mockHoldings} prices={mockPrices} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });
});
