import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import type { PriceMap } from '../types';

const PRICES_KEY = ['prices'] as const;
const POLL_INTERVAL_MS = 180_000;

export function usePrices(enabled: boolean) {
  return useQuery<PriceMap>({
    queryKey: PRICES_KEY,
    queryFn: () => apiRequest<PriceMap>('/api/prices'),
    refetchInterval: POLL_INTERVAL_MS,
    enabled,
  });
}
