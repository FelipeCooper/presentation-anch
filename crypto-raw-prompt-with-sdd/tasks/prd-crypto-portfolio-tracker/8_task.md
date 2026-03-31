# Task 8.0: Dashboard — Summary Cards, Allocation Chart & Live Polling

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Build the main dashboard view with summary cards (total value, cost basis, P&L), a Recharts donut chart for allocation, live price polling with visual indicators, and CoinGecko attribution. This task covers PRD features F2 (Live Price Display), F3 (Portfolio Allocation chart), and F4 (Profit & Loss).

<requirements>
- Dashboard component composing SummaryCards + HoldingsTable + AllocationChart
- SummaryCards: Total Portfolio Value, Total Cost Basis, P&L (absolute USD + percentage)
- P&L styling: green for positive, red for negative, with +/- prefix
- AllocationChart: Recharts donut/pie chart showing each asset's allocation percentage
- Live polling: prices auto-refresh every 180s via usePrices hook
- Loading indicator while prices are being fetched
- Stale/error indicator when price fetch fails (banner or badge)
- CoinGecko attribution displayed in the UI (required by their terms)
- 24h change percentage shown per asset in the table
</requirements>

## Subtasks

- [ ] 8.1 Create `frontend/src/components/SummaryCards.tsx` — three cards: Total Value, Cost Basis, P&L (USD + %)
- [ ] 8.2 Style P&L card with green (gain) / red (loss) colors + "+" prefix for gains
- [ ] 8.3 Create `frontend/src/components/AllocationChart.tsx` — Recharts PieChart (donut) with labels showing asset name + percentage
- [ ] 8.4 Create `frontend/src/components/Dashboard.tsx` — main layout composing SummaryCards, HoldingsTable, AllocationChart
- [ ] 8.5 Add loading indicator (spinner or skeleton) while prices are loading
- [ ] 8.6 Add error/stale banner when price fetch fails — "Prices may be outdated" with last-updated timestamp
- [ ] 8.7 Add CoinGecko attribution: "Powered by CoinGecko" with link
- [ ] 8.8 Integrate Dashboard as the main view in App.tsx
- [ ] 8.9 Write component tests

## Implementation Details

Refer to **techspec.md** sections:
- "Data flow" point 1 for the price polling lifecycle
- "Frontend types" for PriceData (includes lastUpdatedAt for staleness)
- PRD "Core Features" F2, F3, F4 for functional requirements
- PRD "UI Considerations" for layout guidance

Key points:
- SummaryCards calculations:
  - Total Value = sum of (quantity * currentPrice) for all holdings
  - Total Cost Basis = sum of (quantity * avgPurchasePrice) for all holdings
  - P&L ($) = Total Value - Total Cost Basis
  - P&L (%) = (P&L / Total Cost Basis) * 100
- AllocationChart data: array of `{ name: string, value: number }` where value = currentValue per holding
- Recharts PieChart with `innerRadius` for donut effect, custom labels
- usePrices hook's `isLoading`, `isError`, `dataUpdatedAt` drive the loading/error states
- Show "Prices may be outdated" banner when `isError` is true but stale data exists
- CoinGecko attribution: can be a small footer text or badge

## Success Criteria

- Dashboard displays correct total value, cost basis, and P&L
- P&L is visually distinguished (green/red + sign prefix)
- Donut chart accurately represents allocation proportions
- Prices auto-refresh every 180s without user interaction
- Loading state is visible during initial price fetch
- Error banner appears when price fetch fails, without losing displayed data
- CoinGecko attribution is visible

## Task Tests

- [ ] Component tests (`frontend/src/components/SummaryCards.test.tsx`):
  - Test renders correct total value
  - Test renders correct cost basis
  - Test renders positive P&L in green with + prefix
  - Test renders negative P&L in red with - prefix
  - Test renders zero P&L correctly
- [ ] Component tests (`frontend/src/components/AllocationChart.test.tsx`):
  - Test renders chart with correct number of segments
  - Test handles single holding (100% allocation)
  - Test handles empty holdings (no chart rendered)
- [ ] Component tests (`frontend/src/components/Dashboard.test.tsx`):
  - Test renders all sub-components (summary, table, chart)
  - Test shows loading indicator when prices are loading
  - Test shows error banner when price fetch fails
  - Test shows CoinGecko attribution

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT FINISHED</critical>

## Relevant Files

- `frontend/src/components/Dashboard.tsx`
- `frontend/src/components/SummaryCards.tsx`
- `frontend/src/components/AllocationChart.tsx`
- `frontend/src/App.tsx` (use Dashboard as main view)
- `frontend/src/hooks/usePrices.ts` (consume for polling + status)
- `frontend/src/hooks/useHoldings.ts` (consume for totals)

## LINEAR
- []
- []
