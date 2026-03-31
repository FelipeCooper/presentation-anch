import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { apiRequest, ApiError } from './client';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('apiRequest', () => {
  it('returns parsed JSON on success', async () => {
    server.use(
      http.get('/api/test', () =>
        HttpResponse.json({ id: '1', name: 'Bitcoin' }),
      ),
    );

    const data = await apiRequest<{ id: string; name: string }>('/api/test');
    expect(data).toEqual({ id: '1', name: 'Bitcoin' });
  });

  it('throws ApiError with message from error body on non-OK response', async () => {
    server.use(
      http.post('/api/test', () =>
        HttpResponse.json({ error: 'duplicate holding' }, { status: 409 }),
      ),
    );

    await expect(
      apiRequest('/api/test', { method: 'POST', body: '{}' }),
    ).rejects.toThrow(ApiError);

    try {
      await apiRequest('/api/test', { method: 'POST', body: '{}' });
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(409);
      expect(apiErr.message).toBe('duplicate holding');
    }
  });

  it('throws on network error', async () => {
    server.use(
      http.get('/api/fail', () => HttpResponse.error()),
    );

    await expect(apiRequest('/api/fail')).rejects.toThrow();
  });

  it('handles 204 No Content response', async () => {
    server.use(
      http.delete('/api/test/1', () => new HttpResponse(null, { status: 204 })),
    );

    const result = await apiRequest<void>('/api/test/1', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });
});
