import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { HoldingForm } from './HoldingForm';
import { createWrapper } from '../test/wrapper';
import type { Holding } from '../types';

const server = setupServer(
  http.get('/api/holdings', () => HttpResponse.json([])),
  http.get('/api/coins', () =>
    HttpResponse.json([
      { coingeckoId: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
      { coingeckoId: 'bitcoin-cash', symbol: 'bch', name: 'Bitcoin Cash' },
    ]),
  ),
  http.post('/api/holdings', () =>
    HttpResponse.json(
      {
        id: 'new-123',
        coingeckoId: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        quantity: 2,
        avgPurchasePrice: 50000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      { status: 201 },
    ),
  ),
  http.put('/api/holdings/:id', () =>
    HttpResponse.json({
      id: 'abc-123',
      coingeckoId: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      quantity: 3,
      avgPurchasePrice: 55000,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    }),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const existingHolding: Holding = {
  id: 'abc-123',
  coingeckoId: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  quantity: 1.5,
  avgPurchasePrice: 40000,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('HoldingForm', () => {
  it('renders add form when no holding is provided', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingForm onClose={vi.fn()} />
      </Wrapper>,
    );

    expect(screen.getByRole('heading', { name: 'Add Holding' })).toBeInTheDocument();
    expect(screen.getByLabelText('Asset')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Average Purchase Price (USD)'),
    ).toBeInTheDocument();
  });

  it('renders edit form with pre-filled values when holding is provided', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingForm holding={existingHolding} onClose={vi.fn()} />
      </Wrapper>,
    );

    expect(screen.getByText('Edit Holding')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin (BTC)')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity')).toHaveValue(1.5);
    expect(
      screen.getByLabelText('Average Purchase Price (USD)'),
    ).toHaveValue(40000);
  });

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingForm onClose={vi.fn()} />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: /add holding/i }));

    expect(screen.getByText('Please select a coin')).toBeInTheDocument();
    expect(
      screen.getByText('Quantity must be a positive number'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Price must be a positive number'),
    ).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingForm onClose={onClose} />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('submits edit form successfully', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingForm holding={existingHolding} onClose={onClose} />
      </Wrapper>,
    );

    const qtyInput = screen.getByLabelText('Quantity');
    const priceInput = screen.getByLabelText('Average Purchase Price (USD)');

    await user.clear(qtyInput);
    await user.type(qtyInput, '3');
    await user.clear(priceInput);
    await user.type(priceInput, '55000');

    await user.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  it('shows error for duplicate holding (409 conflict)', async () => {
    server.use(
      http.post('/api/holdings', () =>
        HttpResponse.json({ error: 'duplicate' }, { status: 409 }),
      ),
    );

    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingForm onClose={vi.fn()} />
      </Wrapper>,
    );

    // Search and select a coin
    const searchInput = screen.getByLabelText('Asset');
    await user.type(searchInput, 'bit');

    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Bitcoin'));

    const qtyInput = screen.getByLabelText('Quantity');
    const priceInput = screen.getByLabelText('Average Purchase Price (USD)');
    await user.type(qtyInput, '1');
    await user.type(priceInput, '50000');

    await user.click(screen.getByRole('button', { name: /add holding/i }));

    await waitFor(() => {
      expect(
        screen.getByText('A holding for this coin already exists'),
      ).toBeInTheDocument();
    });
  });

  it('closes on backdrop click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingForm onClose={onClose} />
      </Wrapper>,
    );

    // Click on the dialog backdrop (the outer div)
    await user.click(screen.getByRole('dialog'));

    expect(onClose).toHaveBeenCalled();
  });
});
