import type { Page } from '@playwright/test';

export interface MockHolding {
  id: string;
  coingeckoId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPurchasePrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface MockPriceData {
  usd: number;
  usd24hChange: number;
  lastUpdatedAt: number;
}

export interface MockCoin {
  coingeckoId: string;
  symbol: string;
  name: string;
}

export const MOCK_COINS: MockCoin[] = [
  { coingeckoId: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
  { coingeckoId: 'ethereum', symbol: 'eth', name: 'Ethereum' },
  { coingeckoId: 'solana', symbol: 'sol', name: 'Solana' },
];

export const MOCK_PRICES: Record<string, MockPriceData> = {
  bitcoin: { usd: 65000, usd24hChange: 2.5, lastUpdatedAt: 1711700000 },
  ethereum: { usd: 3500, usd24hChange: -1.2, lastUpdatedAt: 1711700000 },
  solana: { usd: 150, usd24hChange: 5.3, lastUpdatedAt: 1711700000 },
};

export function createMockHolding(overrides: Partial<MockHolding> = {}): MockHolding {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    coingeckoId: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    quantity: 1.5,
    avgPurchasePrice: 50000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export const BITCOIN_HOLDING = createMockHolding();

export const ETHEREUM_HOLDING = createMockHolding({
  id: '22222222-2222-2222-2222-222222222222',
  coingeckoId: 'ethereum',
  symbol: 'eth',
  name: 'Ethereum',
  quantity: 10,
  avgPurchasePrice: 3000,
});

/**
 * Sets up API route interception for the given page.
 * Returns a mutable holdings array that tests can modify to change responses.
 */
export async function setupMockAPI(page: Page, initialHoldings: MockHolding[] = []) {
  const holdings = [...initialHoldings];
  let nextId = 100;

  await page.route('**/api/holdings', async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(holdings),
      });
      return;
    }

    if (method === 'POST') {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      const duplicate = holdings.find((h) => h.coingeckoId === body.coingeckoId);
      if (duplicate) {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'A holding for this coin already exists' }),
        });
        return;
      }

      const now = new Date().toISOString();
      const newHolding: MockHolding = {
        id: `generated-${nextId++}`,
        coingeckoId: body.coingeckoId as string,
        symbol: body.symbol as string,
        name: body.name as string,
        quantity: body.quantity as number,
        avgPurchasePrice: body.avgPurchasePrice as number,
        createdAt: now,
        updatedAt: now,
      };
      holdings.push(newHolding);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newHolding),
      });
      return;
    }

    await route.continue();
  });

  await page.route('**/api/holdings/*', async (route) => {
    const method = route.request().method();
    const url = route.request().url();
    const id = url.split('/').pop();

    if (method === 'PUT') {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      const index = holdings.findIndex((h) => h.id === id);
      if (index === -1) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Holding not found' }),
        });
        return;
      }
      holdings[index] = {
        ...holdings[index],
        quantity: body.quantity as number,
        avgPurchasePrice: body.avgPurchasePrice as number,
        updatedAt: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(holdings[index]),
      });
      return;
    }

    if (method === 'DELETE') {
      const index = holdings.findIndex((h) => h.id === id);
      if (index === -1) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Holding not found' }),
        });
        return;
      }
      holdings.splice(index, 1);
      await route.fulfill({ status: 204 });
      return;
    }

    await route.continue();
  });

  await page.route('**/api/prices', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PRICES),
    });
  });

  await page.route('**/api/coins**', async (route) => {
    const url = new URL(route.request().url());
    const query = (url.searchParams.get('q') ?? '').toLowerCase();
    const filtered = MOCK_COINS.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.symbol.toLowerCase().includes(query),
    );
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(filtered),
    });
  });

  return holdings;
}
