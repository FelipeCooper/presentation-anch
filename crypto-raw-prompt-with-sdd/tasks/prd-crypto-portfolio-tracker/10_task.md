# Task 10.0: E2E Tests — Playwright

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Set up Playwright and write end-to-end tests covering the full user flows: empty state, adding/editing/deleting holdings, price refresh, and allocation chart rendering. Tests run against the real backend (or with mocked CoinGecko API at the network level).

<requirements>
- Playwright installed and configured in `frontend/` (or project root)
- Tests run against the full stack: Go backend + PostgreSQL + frontend
- CoinGecko API mocked at network level (Playwright route interception or MSW) to avoid real API calls and rate limits
- Test database is reset between test runs (clean state)
- All major user flows covered per PRD user stories
</requirements>

## Subtasks

- [ ] 10.1 Install Playwright and configure `playwright.config.ts` — base URL, browser settings, webServer config to start both backend and frontend
- [ ] 10.2 Create test helper for database reset — truncate holdings table between tests
- [ ] 10.3 Create CoinGecko API mock — intercept `/api/prices` and `/api/coins` routes with fixture data
- [ ] 10.4 Write E2E test: Empty state → add first holding → dashboard updates
- [ ] 10.5 Write E2E test: Edit holding → verify recalculated P&L
- [ ] 10.6 Write E2E test: Delete holding → verify removal from table
- [ ] 10.7 Write E2E test: Price refresh cycle — verify values update after polling
- [ ] 10.8 Write E2E test: Allocation chart renders with correct proportions
- [ ] 10.9 Write E2E test: Form validation — empty fields, negative numbers
- [ ] 10.10 Configure test to run in CI-friendly mode (headless)

## Implementation Details

Refer to **techspec.md** sections:
- "Testing Approach > E2E Tests" for the specific flows to cover
- "API Endpoints" for the routes to interact with / mock
- PRD "Main Flow" for the user journey

Key points:
- Playwright `webServer` config can start the Go backend and Vite dev server before tests
- Mock CoinGecko responses at the Playwright network level using `page.route()`:
  ```ts
  await page.route('**/api/prices', route => route.fulfill({
    json: { bitcoin: { usd: 50000, usd_24h_change: 2.5, last_updated_at: Date.now() / 1000 } }
  }));
  ```
- For coin search, mock `/api/coins?q=*` to return a fixed set of test coins
- Database reset: call a test endpoint or directly connect to test DB to truncate
- Test selectors: use data-testid attributes on key elements (add-holding-btn, holdings-table, summary-cards, etc.)
- Test flow for "add holding":
  1. Verify empty state is shown
  2. Click "Add Holding" button
  3. Type coin name in search → select from dropdown
  4. Enter quantity and price
  5. Submit form
  6. Verify holding appears in table with correct values
  7. Verify summary cards updated

## Success Criteria

- All E2E tests pass in headless mode
- Tests cover all PRD user stories (add, edit, delete, view dashboard, price refresh)
- Tests are deterministic (no flaky failures from timing or real API calls)
- Database is clean between test runs
- Tests complete within a reasonable time (<60s total)

## Task Tests

- [ ] E2E tests (`frontend/e2e/` or `e2e/`):
  - Test empty state: page shows "Add your first holding" CTA
  - Test add holding: complete flow from empty state to populated dashboard
  - Test add duplicate: shows error message for same coin
  - Test edit holding: changes quantity, verifies updated values in table
  - Test delete holding: removes from table, summary cards recalculate
  - Test price display: mock prices appear in table and summary
  - Test price refresh: after interval, prices update without page reload
  - Test allocation chart: chart visible with holding segments
  - Test form validation: submitting invalid data shows error messages
  - Test keyboard navigation: can complete add flow using keyboard only

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT FINISHED</critical>

## Relevant Files

- `frontend/playwright.config.ts` (or `playwright.config.ts` at root)
- `frontend/e2e/portfolio.spec.ts` (main test file)
- `frontend/e2e/fixtures/` (mock data for CoinGecko responses)
- `frontend/e2e/helpers/` (database reset, common setup)

## LINEAR
- []
- []
