import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import type { Coin } from '../types';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function useDebouncedValue(value: string, delay: number = DEBOUNCE_MS): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useCoins(query: string) {
  const debouncedQuery = useDebouncedValue(query);

  return useQuery<Coin[]>({
    queryKey: ['coins', debouncedQuery],
    queryFn: () =>
      apiRequest<Coin[]>(
        `/api/coins?q=${encodeURIComponent(debouncedQuery)}`,
      ),
    enabled: debouncedQuery.length >= MIN_QUERY_LENGTH,
  });
}
