import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryCards } from './SummaryCards';
import type { Holding, PriceMap } from '../types';

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

describe('SummaryCards', () => {
  it('displays total current value', () => {
    render(<SummaryCards holdings={mockHoldings} prices={mockPrices} />);

    // Total: 1.5*50000 + 10*3000 = 75000 + 30000 = $105,000.00
    expect(screen.getByText('$105,000.00')).toBeInTheDocument();
  });

  it('displays total cost basis', () => {
    render(<SummaryCards holdings={mockHoldings} prices={mockPrices} />);

    // Cost basis: 1.5*40000 + 10*2000 = 60000 + 20000 = $80,000.00
    expect(screen.getByText('$80,000.00')).toBeInTheDocument();
  });

  it('displays absolute P&L', () => {
    render(<SummaryCards holdings={mockHoldings} prices={mockPrices} />);

    // P&L: 105000 - 80000 = +$25,000.00
    expect(screen.getByText('+$25,000.00')).toBeInTheDocument();
  });

  it('displays percentage P&L', () => {
    render(<SummaryCards holdings={mockHoldings} prices={mockPrices} />);

    // P&L%: 25000/80000 * 100 = +31.25%
    expect(screen.getByText('+31.25%')).toBeInTheDocument();
  });

  it('uses green color for positive P&L', () => {
    render(<SummaryCards holdings={mockHoldings} prices={mockPrices} />);

    const pnlElement = screen.getByText('+$25,000.00');
    const dd = pnlElement.closest('dd');
    expect(dd?.className).toContain('text-green-600');
  });

  it('uses red color for negative P&L', () => {
    const expensivePrices: PriceMap = {
      bitcoin: { usd: 30000, usd24hChange: -5, lastUpdatedAt: 1700000000 },
      ethereum: { usd: 1500, usd24hChange: -3, lastUpdatedAt: 1700000000 },
    };

    render(<SummaryCards holdings={mockHoldings} prices={expensivePrices} />);

    // Cost: 80000, Value: 1.5*30000 + 10*1500 = 45000 + 15000 = 60000
    // P&L: -20000
    expect(screen.getByText('-$20,000.00')).toBeInTheDocument();
    const pnlElement = screen.getByText('-$20,000.00');
    const dd = pnlElement.closest('dd');
    expect(dd?.className).toContain('text-red-600');
  });

  it('renders summary labels', () => {
    render(<SummaryCards holdings={mockHoldings} prices={mockPrices} />);

    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('Cost Basis')).toBeInTheDocument();
    expect(screen.getByText('P&L (USD)')).toBeInTheDocument();
    expect(screen.getByText('P&L (%)')).toBeInTheDocument();
  });

  it('has accessible region label', () => {
    render(<SummaryCards holdings={mockHoldings} prices={mockPrices} />);

    expect(screen.getByRole('region', { name: /portfolio summary/i })).toBeInTheDocument();
  });

  it('handles empty prices gracefully', () => {
    render(<SummaryCards holdings={mockHoldings} prices={{}} />);

    // Total value should be $0.00, cost basis still $80,000.00
    expect(screen.getByText('Total Value')).toBeInTheDocument();
  });
});
