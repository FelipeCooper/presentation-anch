# Task 7.0: Holdings CRUD UI

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Build the holdings management UI: a table displaying all holdings, an add/edit form (modal) with a searchable coin selector, delete confirmation, form validation, and an empty state component. This task covers PRD features F1 (Holdings Management) and the tabular part of F3 (allocation percentages in table).

<requirements>
- HoldingsTable component displaying all holdings with columns: Name, Symbol, Quantity, Avg Purchase Price, Current Value, P&L, Allocation %, Actions (edit/delete)
- HoldingForm component (modal) for add and edit operations
- Searchable coin selector in the form using useCoins hook (min 2 chars to search)
- Form validation: quantity > 0, avgPurchasePrice > 0, coin must be selected (for add)
- Inline error messages for invalid inputs
- Delete confirmation (e.g., confirm dialog before calling delete mutation)
- EmptyState component shown when no holdings exist, with CTA to add first holding
- Optimistic updates or loading states for mutations
- All components use named exports (no default exports)
</requirements>

## Subtasks

- [ ] 7.1 Create `frontend/src/components/HoldingsTable.tsx` — table with all columns, receives holdings + prices as props, calculates current value/P&L/allocation per row
- [ ] 7.2 Create `frontend/src/components/HoldingForm.tsx` — modal form with coin search, quantity input, price input, validation, submit handler
- [ ] 7.3 Implement coin search selector in HoldingForm — input field that queries useCoins, dropdown showing results, selecting a coin fills coingeckoId/symbol/name
- [ ] 7.4 Implement edit mode for HoldingForm — pre-fill quantity and price, disable coin selector, call update mutation
- [ ] 7.5 Implement delete with confirmation — button in table row, confirm dialog, calls delete mutation
- [ ] 7.6 Create `frontend/src/components/EmptyState.tsx` — message + "Add your first holding" button
- [ ] 7.7 Integrate all components in App.tsx — show EmptyState or HoldingsTable based on holdings count, "Add Holding" button opens form
- [ ] 7.8 Write component tests

## Implementation Details

Refer to **techspec.md** sections:
- "API Endpoints" for request/response shapes used by mutations
- "Frontend types" for TypeScript interfaces
- PRD "User Stories" 1, 2 and "Core Features > F1" for functional requirements

Key points:
- HoldingsTable columns and calculations:
  - Current Value = quantity * price (from usePrices data)
  - P&L ($) = currentValue - (quantity * avgPurchasePrice)
  - P&L (%) = (P&L / costBasis) * 100
  - Allocation (%) = (currentValue / totalPortfolioValue) * 100
- Form validation should happen client-side before submitting (and backend validates too)
- Coin selector: when user types >= 2 chars, show dropdown with matching coins from `GET /api/coins?q=`. On select, auto-fill symbol and name fields.
- For edit mode, only quantity and avgPurchasePrice are editable
- Use Tailwind CSS for all styling
- PRD FR-1.4: prevent adding duplicate coins — show error from backend 409 response

## Success Criteria

- User can add a new holding via the form with coin search
- User can edit quantity and price of existing holding
- User can delete a holding with confirmation
- Form validates inputs and shows inline errors
- Empty state is shown when no holdings exist
- Table displays correct calculated values (current value, P&L, allocation)
- All components render without TypeScript errors

## Task Tests

- [ ] Component tests (`frontend/src/components/HoldingsTable.test.tsx`):
  - Test renders all holdings with correct columns
  - Test calculates current value correctly
  - Test calculates P&L correctly (positive and negative)
  - Test calculates allocation percentages
  - Test edit button opens form in edit mode
  - Test delete button shows confirmation
- [ ] Component tests (`frontend/src/components/HoldingForm.test.tsx`):
  - Test renders empty form for add mode
  - Test renders pre-filled form for edit mode
  - Test validates quantity > 0
  - Test validates avgPurchasePrice > 0
  - Test coin search shows results dropdown
  - Test selecting a coin fills the form fields
  - Test submit calls create mutation (add mode)
  - Test submit calls update mutation (edit mode)
- [ ] Component tests (`frontend/src/components/EmptyState.test.tsx`):
  - Test renders CTA message and button
  - Test button click triggers add holding action

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT FINISHED</critical>

## Relevant Files

- `frontend/src/components/HoldingsTable.tsx`
- `frontend/src/components/HoldingForm.tsx`
- `frontend/src/components/EmptyState.tsx`
- `frontend/src/App.tsx` (integrate components)
- `frontend/src/hooks/useHoldings.ts` (consume)
- `frontend/src/hooks/usePrices.ts` (consume)
- `frontend/src/hooks/useCoins.ts` (consume in form)

## LINEAR
- []
- []
