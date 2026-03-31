import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useCoins, useDebouncedValue } from './useCoins';
import { createWrapper } from '../test/wrapper';

const mockCoins = [
  { coingeckoId: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
];

const server = setupServer(
  http.get('/api/coins', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    if (q === 'bit') {
      return HttpResponse.json(mockCoins);
    }
    return HttpResponse.json([]);
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useDebouncedValue', () => {
  it('debounces value changes', async () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: '' } },
    );

    expect(result.current).toBe('');

    rerender({ value: 'bit' });
    expect(result.current).toBe('');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('bit');

    vi.useRealTimers();
  });
});

describe('useCoins', () => {
  it('does not fetch when query is shorter than 2 characters', () => {
    const { result } = renderHook(() => useCoins('b'), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches coins when query is at least 2 characters (after debounce)', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useCoins('bit'), {
      wrapper: createWrapper(),
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    vi.useRealTimers();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockCoins);
  });
});
