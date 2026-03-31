import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import type {
  Holding,
  CreateHoldingRequest,
  UpdateHoldingRequest,
} from '../types';

const HOLDINGS_KEY = ['holdings'] as const;

export function useHoldings() {
  return useQuery<Holding[]>({
    queryKey: HOLDINGS_KEY,
    queryFn: () => apiRequest<Holding[]>('/api/holdings'),
  });
}

export function useCreateHolding() {
  const queryClient = useQueryClient();

  return useMutation<Holding, Error, CreateHoldingRequest>({
    mutationFn: (data) =>
      apiRequest<Holding>('/api/holdings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HOLDINGS_KEY });
    },
  });
}

export function useUpdateHolding() {
  const queryClient = useQueryClient();

  return useMutation<Holding, Error, { id: string; data: UpdateHoldingRequest }>({
    mutationFn: ({ id, data }) =>
      apiRequest<Holding>(`/api/holdings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HOLDINGS_KEY });
    },
  });
}

export function useDeleteHolding() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiRequest<void>(`/api/holdings/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HOLDINGS_KEY });
    },
  });
}
