import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { usePrices } from './usePrices';
import { createWrapper } from '../test/wrapper';

const mockPrices = {
  bitcoin: { usd: 65000, usd24hChange: 2.5, lastUpdatedAt: 1700000000 },
  ethereum: { usd: 3500, usd24hChange: -1.2, lastUpdatedAt: 1700000000 },
};

const server = setupServer(
  http.get('/api/prices', () => HttpResponse.json(mockPrices)),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('usePrices', () => {
  it('fetches prices when enabled', async () => {
    const { result } = renderHook(() => usePrices(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPrices);
  });

  it('does not fetch when disabled', () => {
    const { result } = renderHook(() => usePrices(false), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});
