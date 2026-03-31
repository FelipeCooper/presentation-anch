import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useHoldings, useCreateHolding } from './useHoldings';
import { createWrapper } from '../test/wrapper';

const mockHoldings = [
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

const server = setupServer(
  http.get('/api/holdings', () => HttpResponse.json(mockHoldings)),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useHoldings', () => {
  it('fetches holdings from GET /api/holdings', async () => {
    const { result } = renderHook(() => useHoldings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockHoldings);
  });
});

describe('useCreateHolding', () => {
  it('calls POST /api/holdings with the provided data', async () => {
    const newHolding = {
      coingeckoId: 'ethereum',
      symbol: 'eth',
      name: 'Ethereum',
      quantity: 10,
      avgPurchasePrice: 2000,
    };

    const createdResponse = {
      ...newHolding,
      id: 'def-456',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    server.use(
      http.post('/api/holdings', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual(newHolding);
        return HttpResponse.json(createdResponse, { status: 201 });
      }),
    );

    const { result } = renderHook(() => useCreateHolding(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newHolding);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(createdResponse);
  });
});
