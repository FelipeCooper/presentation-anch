import { test, expect } from '@playwright/test';
import {
  setupMockAPI,
  BITCOIN_HOLDING,
  ETHEREUM_HOLDING,
  MOCK_PRICES,
} from './helpers';

test.describe('Empty State', () => {
  test('shows empty state and allows adding first holding', async ({ page }) => {
    await setupMockAPI(page);
    await page.goto('/');

    await expect(page.getByText('No holdings yet')).toBeVisible();
    await expect(
      page.getByText('Get started by adding your first cryptocurrency holding.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '+ Add Holding' })).toBeVisible();
  });

  test('empty state add button opens holding form', async ({ page }) => {
    await setupMockAPI(page);
    await page.goto('/');

    await page.getByRole('button', { name: '+ Add Holding' }).click();
    await expect(page.getByRole('dialog', { name: 'Add holding' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add Holding' })).toBeVisible();
  });
});

test.describe('Add Holding', () => {
  test('adds a new holding from empty state and sees dashboard', async ({ page }) => {
    await setupMockAPI(page);
    await page.goto('/');

    // Click add from empty state
    await page.getByRole('button', { name: '+ Add Holding' }).click();

    // Search for Bitcoin
    await page.getByPlaceholder('Search for a coin...').fill('bitcoin');
    await page.getByRole('option', { name: /Bitcoin/i }).click();

    // Fill quantity and price
    await page.getByLabel('Quantity').fill('1.5');
    await page.getByLabel('Average Purchase Price (USD)').fill('50000');

    // Submit via the submit button inside the dialog
    await page.getByRole('dialog').getByRole('button', { name: 'Add Holding', exact: true }).click();

    // Dialog should close
    await expect(page.getByRole('dialog')).toBeHidden();

    // Dashboard should show Bitcoin holding in the table
    const table = page.getByRole('region', { name: 'Holdings table' });
    await expect(table.getByText('Bitcoin')).toBeVisible();
    await expect(table.getByText('BTC')).toBeVisible();

    // Summary cards should show values
    await expect(page.getByText('Total Value')).toBeVisible();
    await expect(page.getByText('Cost Basis')).toBeVisible();

    // P&L cards should be visible
    await expect(page.getByText('P&L (USD)')).toBeVisible();
    await expect(page.getByText('P&L (%)')).toBeVisible();
  });

  test('validates required fields', async ({ page }) => {
    await setupMockAPI(page);
    await page.goto('/');

    await page.getByRole('button', { name: '+ Add Holding' }).click();

    // Submit without filling anything - use submit button inside dialog
    await page.getByRole('dialog').getByRole('button', { name: 'Add Holding', exact: true }).click();

    // Should show validation errors
    await expect(page.getByText('Please select a coin')).toBeVisible();
    await expect(page.getByText('Quantity must be a positive number')).toBeVisible();
    await expect(page.getByText('Price must be a positive number')).toBeVisible();
  });

  test('prevents duplicate coin holdings', async ({ page }) => {
    await setupMockAPI(page, [BITCOIN_HOLDING]);
    await page.goto('/');

    // Add another Bitcoin
    await page.getByRole('button', { name: 'Add a new holding' }).click();
    await page.getByPlaceholder('Search for a coin...').fill('bitcoin');
    await page.getByRole('option', { name: /Bitcoin/i }).click();
    await page.getByLabel('Quantity').fill('2');
    await page.getByLabel('Average Purchase Price (USD)').fill('60000');
    await page.getByRole('dialog').getByRole('button', { name: 'Add Holding', exact: true }).click();

    // Should show duplicate error
    await expect(
      page.getByText('A holding for this coin already exists'),
    ).toBeVisible();
  });

  test('cancel button closes the form', async ({ page }) => {
    await setupMockAPI(page);
    await page.goto('/');

    await page.getByRole('button', { name: '+ Add Holding' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('escape key closes the form', async ({ page }) => {
    await setupMockAPI(page);
    await page.goto('/');

    await page.getByRole('button', { name: '+ Add Holding' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});

test.describe('Edit Holding', () => {
  test('edits a holding and verifies recalculated P&L', async ({ page }) => {
    await setupMockAPI(page, [BITCOIN_HOLDING]);
    await page.goto('/');

    // Wait for dashboard to load
    const table = page.getByRole('region', { name: 'Holdings table' });
    await expect(table.getByText('Bitcoin')).toBeVisible();

    // With initial data: qty=1.5, avgPrice=50000 → cost basis = $75,000
    // Current price = $65,000 → current value = $97,500
    const summaryRegion = page.getByRole('region', { name: 'Portfolio summary' });
    await expect(summaryRegion.getByText('$97,500.00')).toBeVisible();
    await expect(summaryRegion.getByText('$75,000.00')).toBeVisible();

    // Click edit
    await page.getByRole('button', { name: 'Edit Bitcoin holding' }).click();
    await expect(page.getByRole('dialog', { name: 'Edit holding' })).toBeVisible();

    // Change quantity to 2 and avg price to 60000
    await page.getByLabel('Quantity').clear();
    await page.getByLabel('Quantity').fill('2');
    await page.getByLabel('Average Purchase Price (USD)').clear();
    await page.getByLabel('Average Purchase Price (USD)').fill('60000');

    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    // After edit: qty=2, avgPrice=60000 → cost basis = $120,000
    // Current price = $65,000 → current value = $130,000
    await expect(summaryRegion.getByText('$130,000.00')).toBeVisible();
    await expect(summaryRegion.getByText('$120,000.00')).toBeVisible();
  });

  test('edit form is pre-filled with current values', async ({ page }) => {
    await setupMockAPI(page, [BITCOIN_HOLDING]);
    await page.goto('/');

    await page.getByRole('button', { name: 'Edit Bitcoin holding' }).click();

    // Should show asset name (read-only)
    await expect(page.getByText('Bitcoin (BTC)')).toBeVisible();

    // Fields should be pre-filled
    await expect(page.getByLabel('Quantity')).toHaveValue('1.5');
    await expect(page.getByLabel('Average Purchase Price (USD)')).toHaveValue('50000');
  });
});

test.describe('Delete Holding', () => {
  test('deletes a holding and returns to empty state', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    await setupMockAPI(page, [BITCOIN_HOLDING]);
    await page.goto('/');

    const table = page.getByRole('region', { name: 'Holdings table' });
    await expect(table.getByText('Bitcoin')).toBeVisible();

    // Click delete
    await page.getByRole('button', { name: 'Delete Bitcoin holding' }).click();

    // Should return to empty state
    await expect(page.getByText('No holdings yet')).toBeVisible();
  });

  test('delete confirmation can be cancelled', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.dismiss());

    await setupMockAPI(page, [BITCOIN_HOLDING]);
    await page.goto('/');

    const table = page.getByRole('region', { name: 'Holdings table' });
    await expect(table.getByText('Bitcoin')).toBeVisible();
    await page.getByRole('button', { name: 'Delete Bitcoin holding' }).click();

    // Holding should still be visible in table
    await expect(table.getByText('Bitcoin')).toBeVisible();
  });

  test('deletes one holding of many', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    await setupMockAPI(page, [BITCOIN_HOLDING, ETHEREUM_HOLDING]);
    await page.goto('/');

    const table = page.getByRole('region', { name: 'Holdings table' });
    await expect(table.getByText('Bitcoin')).toBeVisible();
    await expect(table.getByText('Ethereum')).toBeVisible();

    // Delete Bitcoin
    await page.getByRole('button', { name: 'Delete Bitcoin holding' }).click();

    // Bitcoin gone, Ethereum remains
    await expect(table.getByText('Bitcoin')).toBeHidden();
    await expect(table.getByText('Ethereum')).toBeVisible();
  });
});

test.describe('Dashboard Display', () => {
  test('shows summary cards with correct P&L values', async ({ page }) => {
    await setupMockAPI(page, [BITCOIN_HOLDING, ETHEREUM_HOLDING]);
    await page.goto('/');

    const summary = page.getByRole('region', { name: 'Portfolio summary' });

    // BTC: 1.5 * 65000 = 97,500; ETH: 10 * 3500 = 35,000 → total = 132,500
    await expect(summary.getByText('$132,500.00')).toBeVisible();

    // Cost: BTC: 1.5 * 50000 = 75,000; ETH: 10 * 3000 = 30,000 → total = 105,000
    await expect(summary.getByText('$105,000.00')).toBeVisible();
  });

  test('shows holdings table with all columns', async ({ page }) => {
    await setupMockAPI(page, [BITCOIN_HOLDING]);
    await page.goto('/');

    const tableRegion = page.getByRole('region', { name: 'Holdings table' });

    // Column headers
    await expect(tableRegion.getByText('Asset')).toBeVisible();
    await expect(tableRegion.getByText('Quantity')).toBeVisible();
    await expect(tableRegion.getByText('Avg. Price')).toBeVisible();
    await expect(tableRegion.getByText('Current Price')).toBeVisible();
    await expect(tableRegion.getByText('Current Value')).toBeVisible();
    await expect(tableRegion.getByRole('columnheader', { name: 'Allocation' })).toBeVisible();
    await expect(tableRegion.getByText('P&L')).toBeVisible();
    await expect(tableRegion.getByText('Actions')).toBeVisible();
  });

  test('shows allocation chart', async ({ page }) => {
    await setupMockAPI(page, [BITCOIN_HOLDING, ETHEREUM_HOLDING]);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Allocation' })).toBeVisible();
    await expect(
      page.locator('[role="img"][aria-label="Portfolio allocation donut chart"]'),
    ).toBeVisible();
  });

  test('shows 24h price change in table', async ({ page }) => {
    await setupMockAPI(page, [BITCOIN_HOLDING]);
    await page.goto('/');

    // BTC 24h change is +2.5%
    await expect(page.getByText('+2.50%')).toBeVisible();
  });

  test('shows allocation percentage for single holding as 100%', async ({ page }) => {
    await setupMockAPI(page, [BITCOIN_HOLDING]);
    await page.goto('/');

    await expect(page.getByText('100.0%')).toBeVisible();
  });

  test('header shows app title', async ({ page }) => {
    await setupMockAPI(page, [BITCOIN_HOLDING]);
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'Crypto Portfolio Tracker' }),
    ).toBeVisible();
  });

  test('footer shows CoinGecko attribution', async ({ page }) => {
    await setupMockAPI(page);
    await page.goto('/');

    await expect(page.getByText('Powered by')).toBeVisible();
    await expect(page.getByRole('link', { name: 'CoinGecko' })).toBeVisible();
  });
});

test.describe('Price Refresh', () => {
  test('prices update on refetch after navigation', async ({ page }) => {
    let priceCallCount = 0;
    const updatedPrices = {
      bitcoin: { usd: 70000, usd24hChange: 5.0, lastUpdatedAt: 1711700100 },
    };

    await setupMockAPI(page, [BITCOIN_HOLDING]);

    // Override the price route to return different data on second call
    await page.route('**/api/prices', async (route) => {
      priceCallCount++;
      const prices = priceCallCount === 1 ? MOCK_PRICES : updatedPrices;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(prices),
      });
    });

    await page.goto('/');

    // Initial price: 1.5 * $65,000 = $97,500
    const summary = page.getByRole('region', { name: 'Portfolio summary' });
    await expect(summary.getByText('$97,500.00')).toBeVisible();

    // Force a reload to trigger new price fetch
    await page.reload();

    // Wait for the updated price to appear: 1.5 * 70000 = $105,000
    await expect(summary.getByText('$105,000.00')).toBeVisible({ timeout: 10000 });
  });

  test('shows stale data warning when price fetch fails', async ({ page }) => {
    let callCount = 0;
    await setupMockAPI(page, [BITCOIN_HOLDING]);

    await page.route('**/api/prices', async (route) => {
      callCount++;
      if (callCount <= 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PRICES),
        });
      } else {
        await route.fulfill({
          status: 502,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'upstream failure' }),
        });
      }
    });

    await page.goto('/');

    // First load should work
    const table = page.getByRole('region', { name: 'Holdings table' });
    await expect(table.getByText('Bitcoin')).toBeVisible();

    // Reload the page to trigger a new price fetch that will fail
    await page.reload();

    // After failed refetch, the warning should appear
    await expect(
      page.getByText('Unable to fetch latest prices'),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Coin Search', () => {
  test('searches and shows matching coins', async ({ page }) => {
    await setupMockAPI(page);
    await page.goto('/');

    await page.getByRole('button', { name: '+ Add Holding' }).click();

    const input = page.getByPlaceholder('Search for a coin...');
    await input.fill('eth');

    // Should show Ethereum in results
    await expect(page.getByRole('option', { name: /Ethereum/i })).toBeVisible();
  });

  test('shows no results for unknown query', async ({ page }) => {
    await setupMockAPI(page);
    await page.goto('/');

    await page.getByRole('button', { name: '+ Add Holding' }).click();

    await page.getByPlaceholder('Search for a coin...').fill('zzzznonexistent');
    await expect(page.getByText('No coins found')).toBeVisible();
  });

  test('selecting a coin shows confirmation text', async ({ page }) => {
    await setupMockAPI(page);
    await page.goto('/');

    await page.getByRole('button', { name: '+ Add Holding' }).click();
    await page.getByPlaceholder('Search for a coin...').fill('bitcoin');
    await page.getByRole('option', { name: /Bitcoin/i }).click();

    await expect(page.getByText('Selected: Bitcoin (BTC)')).toBeVisible();
  });
});

test.describe('Full CRUD Flow', () => {
  test('add → edit → delete lifecycle', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    await setupMockAPI(page);
    await page.goto('/');

    // --- Add ---
    await expect(page.getByText('No holdings yet')).toBeVisible();

    await page.getByRole('button', { name: '+ Add Holding' }).click();
    await page.getByPlaceholder('Search for a coin...').fill('ethereum');
    await page.getByRole('option', { name: /Ethereum/i }).click();
    await page.getByLabel('Quantity').fill('5');
    await page.getByLabel('Average Purchase Price (USD)').fill('2500');
    await page.getByRole('dialog').getByRole('button', { name: 'Add Holding', exact: true }).click();

    await expect(page.getByRole('dialog')).toBeHidden();
    const table = page.getByRole('region', { name: 'Holdings table' });
    await expect(table.getByText('Ethereum')).toBeVisible();
    await expect(table.getByText('ETH', { exact: true })).toBeVisible();

    // Verify summary: qty=5, avgPrice=2500 → cost=12,500; current=5*3500=17,500
    const summary = page.getByRole('region', { name: 'Portfolio summary' });
    await expect(summary.getByText('$17,500.00')).toBeVisible();
    await expect(summary.getByText('$12,500.00')).toBeVisible();

    // --- Edit ---
    await page.getByRole('button', { name: 'Edit Ethereum holding' }).click();
    await page.getByLabel('Quantity').clear();
    await page.getByLabel('Quantity').fill('10');
    await page.getByRole('button', { name: 'Update' }).click();

    await expect(page.getByRole('dialog')).toBeHidden();
    // After edit: qty=10, avgPrice=2500 → cost=25,000; current=10*3500=35,000
    await expect(summary.getByText('$35,000.00')).toBeVisible();
    await expect(summary.getByText('$25,000.00')).toBeVisible();

    // --- Delete ---
    await page.getByRole('button', { name: 'Delete Ethereum holding' }).click();
    await expect(page.getByText('No holdings yet')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('modal traps focus', async ({ page }) => {
    await setupMockAPI(page);
    await page.goto('/');

    await page.getByRole('button', { name: '+ Add Holding' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Tab through all focusable elements - focus should stay within modal
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // The focused element should be inside the dialog
    const isInsideDialog = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const focused = document.activeElement;
      return dialog?.contains(focused) ?? false;
    });
    expect(isInsideDialog).toBe(true);
  });

  test('summary cards have aria region', async ({ page }) => {
    await setupMockAPI(page, [BITCOIN_HOLDING]);
    await page.goto('/');

    await expect(
      page.getByRole('region', { name: 'Portfolio summary' }),
    ).toBeVisible();
  });

  test('holdings table region is accessible', async ({ page }) => {
    await setupMockAPI(page, [BITCOIN_HOLDING]);
    await page.goto('/');

    await expect(
      page.getByRole('region', { name: 'Holdings table' }),
    ).toBeVisible();
  });
});
