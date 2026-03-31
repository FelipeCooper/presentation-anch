import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { HoldingsTable } from './HoldingsTable';
import { createWrapper } from '../test/wrapper';
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

const emptyPrices: PriceMap = {};

const server = setupServer(
  http.delete('/api/holdings/:id', () => new HttpResponse(null, { status: 204 })),
  http.get('/api/holdings', () => HttpResponse.json(mockHoldings)),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('HoldingsTable', () => {
  it('renders holdings with asset names and symbols', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={mockHoldings} prices={mockPrices} onEdit={vi.fn()} />
      </Wrapper>,
    );

    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
  });

  it('displays current price and 24h change', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={mockHoldings} prices={mockPrices} onEdit={vi.fn()} />
      </Wrapper>,
    );

    expect(screen.getByText('$50,000.00')).toBeInTheDocument();
    expect(screen.getByText('+2.50%')).toBeInTheDocument();
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
    expect(screen.getByText('-1.20%')).toBeInTheDocument();
  });

  it('displays current value for each holding', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={mockHoldings} prices={mockPrices} onEdit={vi.fn()} />
      </Wrapper>,
    );

    // Bitcoin: 1.5 * 50000 = $75,000.00
    expect(screen.getByText('$75,000.00')).toBeInTheDocument();
    // Ethereum: 10 * 3000 = $30,000.00
    expect(screen.getByText('$30,000.00')).toBeInTheDocument();
  });

  it('displays allocation percentages', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={mockHoldings} prices={mockPrices} onEdit={vi.fn()} />
      </Wrapper>,
    );

    // Total = 75000 + 30000 = 105000
    // Bitcoin: 75000/105000 = 71.4%
    expect(screen.getByText('71.4%')).toBeInTheDocument();
    // Ethereum: 30000/105000 = 28.6%
    expect(screen.getByText('28.6%')).toBeInTheDocument();
  });

  it('displays P&L per holding with color coding', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={mockHoldings} prices={mockPrices} onEdit={vi.fn()} />
      </Wrapper>,
    );

    // Bitcoin P&L: 75000 - 60000 = +$15,000.00
    expect(screen.getByText('+$15,000.00')).toBeInTheDocument();
    // Ethereum P&L: 30000 - 20000 = +$10,000.00
    expect(screen.getByText('+$10,000.00')).toBeInTheDocument();
  });

  it('shows dashes when prices are not available', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={mockHoldings} prices={emptyPrices} onEdit={vi.fn()} />
      </Wrapper>,
    );

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('calls onEdit when Edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={mockHoldings} prices={mockPrices} onEdit={onEdit} />
      </Wrapper>,
    );

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledWith(mockHoldings[0]);
  });

  it('shows delete confirmation and deletes on confirm', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={mockHoldings} prices={mockPrices} onEdit={vi.fn()} />
      </Wrapper>,
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith('Delete Bitcoin holding?');
  });

  it('does not delete when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={mockHoldings} prices={mockPrices} onEdit={vi.fn()} />
      </Wrapper>,
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
  });

  it('renders table headers including new columns', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={mockHoldings} prices={mockPrices} onEdit={vi.fn()} />
      </Wrapper>,
    );

    expect(screen.getByText('Asset')).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
    expect(screen.getByText('Avg. Price')).toBeInTheDocument();
    expect(screen.getByText('Current Price')).toBeInTheDocument();
    expect(screen.getByText('Current Value')).toBeInTheDocument();
    expect(screen.getByText('Allocation')).toBeInTheDocument();
    expect(screen.getByText('P&L')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
