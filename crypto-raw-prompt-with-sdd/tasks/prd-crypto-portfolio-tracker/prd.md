# Product Requirements Document (PRD)

## Overview

Many crypto holders track their portfolios using spreadsheets or mental math, leading to an inaccurate picture of their positions and performance. The Crypto Portfolio Tracker is a single-user web application that lets an individual manually record their crypto holdings and see a live dashboard showing current prices (via CoinGecko), portfolio allocation, and overall profit & loss. The goal is to give the user a clear, at-a-glance understanding of what they own, what it's worth right now, and whether they are up or down.

## Objectives

1. **Accurate live pricing** - Display current USD prices for all held assets, refreshed automatically, so the user never relies on stale data.
2. **Portfolio visibility** - Show the percentage allocation of each asset relative to the total portfolio value.
3. **P&L awareness** - Calculate and display the overall gain or loss (absolute USD and percentage) based on the user's cost basis versus current market value.
4. **Low friction data entry** - Allow the user to add, edit, and remove holdings in under 10 seconds per action.

## User Stories

1. **As a crypto holder**, I want to add a holding by selecting an asset, entering the quantity, and entering my average purchase price, so that my portfolio reflects what I own.
2. **As a crypto holder**, I want to edit or delete an existing holding, so that I can correct mistakes or reflect sold positions.
3. **As a crypto holder**, I want to see a dashboard showing all my holdings with their live USD prices, current value, and weight in the portfolio, so that I understand my exposure at a glance.
4. **As a crypto holder**, I want to see my total portfolio value, total cost basis, and overall P&L (in USD and as a percentage), so that I know whether I am profitable.
5. **As a crypto holder**, I want to see a visual breakdown (chart) of my portfolio allocation by asset, so that I can quickly identify concentration risk.
6. **As a crypto holder**, I want prices to refresh automatically without manually reloading the page, so that I always see up-to-date information.

## Core Features

### F1. Holdings Management

Users can create, read, update, and delete holdings. Each holding consists of:

- **Asset**: selected from a searchable list of coins available on CoinGecko.
- **Quantity**: the amount of the asset held (decimal, > 0).
- **Average purchase price (USD)**: the cost basis per unit.

**Functional requirements:**

- FR-1.1: The system shall allow the user to add a new holding by specifying asset, quantity, and average purchase price.
- FR-1.2: The system shall allow the user to edit the quantity and average purchase price of an existing holding.
- FR-1.3: The system shall allow the user to delete a holding.
- FR-1.4: The system shall prevent duplicate holdings for the same asset (one entry per coin).
- FR-1.5: The system shall validate that quantity and purchase price are positive numbers.

### F2. Live Price Display

The dashboard fetches current USD prices from the CoinGecko API and displays them alongside each holding.

**Functional requirements:**

- FR-2.1: The system shall fetch current USD prices for all held assets from the CoinGecko `/simple/price` endpoint.
- FR-2.2: The system shall display the current price, 24-hour price change percentage, and last-updated timestamp for each asset.
- FR-2.3: The system shall auto-refresh prices on a regular interval (configurable, default 60 seconds).
- FR-2.4: The system shall display a loading indicator while prices are being fetched.
- FR-2.5: The system shall show a clear error state if the price fetch fails (e.g., rate limit exceeded), without losing previously displayed data.

### F3. Portfolio Allocation

A visual and tabular breakdown of how the portfolio is distributed across assets.

**Functional requirements:**

- FR-3.1: The system shall calculate each asset's weight as `(asset current value / total portfolio value) * 100`.
- FR-3.2: The system shall display allocation percentages in the holdings table.
- FR-3.3: The system shall render a pie or donut chart showing allocation by asset.

### F4. Profit & Loss (P&L)

Simple overall P&L comparing total cost basis to total current market value.

**Functional requirements:**

- FR-4.1: The system shall calculate cost basis per holding as `quantity * average purchase price`.
- FR-4.2: The system shall calculate current value per holding as `quantity * current price`.
- FR-4.3: The system shall display total portfolio cost basis, total current value, absolute P&L (USD), and percentage P&L.
- FR-4.4: The system shall visually distinguish positive P&L (gain) from negative P&L (loss) using color (green/red).

## User Experience

### Persona

A single individual who holds multiple cryptocurrencies and wants a private, self-hosted dashboard to monitor their portfolio.

### Main Flow

1. User opens the app and sees the dashboard with their existing holdings (or an empty state prompting them to add their first holding).
2. User clicks "Add Holding", fills in asset/quantity/price in a form (modal or inline), and submits.
3. The dashboard updates immediately to reflect the new holding with live price, allocation, and P&L.
4. Prices refresh automatically in the background; the user sees values update without interaction.

### UI Considerations

- Single-page layout: one main dashboard view with a holdings table, summary cards (total value, P&L), and an allocation chart.
- Responsive design: usable on desktop and tablet viewports.
- Form validation with inline error messages for invalid inputs.
- Empty state: when no holdings exist, show a clear call-to-action to add the first holding.

### Accessibility

- All interactive elements must be keyboard-navigable.
- Color is not the only indicator for P&L direction (include +/- sign and/or icons).
- Chart must include a text-based alternative (the allocation table serves this purpose).

## High-Level Technical Constraints

- **External integration**: CoinGecko Demo API (free tier). Requires a demo API key passed via `x-cg-demo-api-key` header. Rate limited to ~30 requests/minute and 10,000 requests/month. CoinGecko attribution must be displayed in the UI.
- **Data persistence**: Holdings and cost basis must be persisted in a database so data survives server restarts.
- **Performance**: Dashboard should load and display cached prices within 2 seconds. Fresh price fetch should complete within 5 seconds.
- **Security**: The CoinGecko API key must not be exposed to the frontend; all API calls to CoinGecko must be proxied through the backend.
- **Single user**: No authentication or authorization is required for this version.

## Out of Scope

- **Trading / swaps**: No ability to buy, sell, or exchange assets through the app.
- **Price alerts & notifications**: No email, push, or in-app alerts on price movements.
- **Wallet integrations**: No connection to on-chain wallets or exchanges.
- **Tax reporting**: No capital gains calculation, tax-lot matching, or report generation.
- **Multi-user / authentication**: No login, registration, or user management.
- **CSV import**: No bulk import of holdings from files.
- **Historical performance charts**: No time-series visualization of portfolio value over time (future consideration).
- **Multi-currency**: All values displayed in USD only.
