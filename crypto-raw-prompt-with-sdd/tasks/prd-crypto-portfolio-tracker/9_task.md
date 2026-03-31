# Task 9.0: Polish — Accessibility, Responsive Design & Error States

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Polish the application for production readiness: ensure keyboard accessibility, add non-color P&L indicators, make the layout responsive for desktop and tablet, improve error states and loading skeletons, and add any missing edge-case handling.

<requirements>
- All interactive elements (buttons, inputs, modal, table rows) are keyboard-navigable
- P&L direction indicated by more than just color: +/- sign prefix and/or up/down arrow icons
- Responsive layout: dashboard works on desktop (1024px+) and tablet (768px+)
- Table is scrollable on small viewports
- Form modal is accessible: focus trap, escape to close, aria-labels
- Loading skeletons for initial data fetch (instead of blank screen)
- Error boundary for unhandled React errors
- Proper number formatting: USD with 2 decimals, crypto quantities with appropriate precision, percentages with 2 decimals
- Graceful handling of edge cases: very large numbers, very small quantities, zero holdings with prices
</requirements>

## Subtasks

- [ ] 9.1 Audit all interactive elements for keyboard navigation — add tabIndex, onKeyDown handlers, focus styles where missing
- [ ] 9.2 Add aria-labels to buttons, inputs, modal, chart — ensure screen reader compatibility
- [ ] 9.3 Add +/- prefix and arrow icons (or text indicators) to P&L values so color is not the sole indicator
- [ ] 9.4 Make layout responsive: use Tailwind responsive breakpoints, stack cards vertically on tablet, horizontal on desktop
- [ ] 9.5 Make holdings table horizontally scrollable on narrow viewports
- [ ] 9.6 Add focus trap to HoldingForm modal — trap tab within modal when open, return focus on close
- [ ] 9.7 Add loading skeletons for initial page load (shimmer placeholders for cards, table, chart)
- [ ] 9.8 Add React error boundary component wrapping the app
- [ ] 9.9 Add consistent number formatting utility: formatUSD, formatCrypto, formatPercent
- [ ] 9.10 Test edge cases: empty portfolio, single holding, very large/small values

## Implementation Details

Refer to **techspec.md** sections:
- PRD "Accessibility" section for specific requirements
- PRD "UI Considerations" for responsive design requirements
- "Known Risks" for error handling patterns

Key points:
- Tailwind responsive: `md:` prefix for tablet (768px), `lg:` for desktop (1024px)
- Number formatting: use `Intl.NumberFormat` for locale-aware formatting
  - USD: `$1,234.56` (2 decimal places)
  - Crypto quantity: up to 8 decimal places, trim trailing zeros
  - Percentage: `+12.34%` or `-5.67%` (2 decimal places, always show sign)
- Focus trap library: can use a simple custom hook or `@headlessui/react` Dialog
- Error boundary: class component with `componentDidCatch`, renders fallback UI
- Chart accessibility: the allocation table serves as the text alternative per PRD

## Success Criteria

- All interactive elements reachable and operable via keyboard alone
- P&L is distinguishable without color (by sign and/or icon)
- Dashboard is usable on 768px and 1024px viewports
- Modal traps focus and closes on Escape
- Loading states show skeletons, not blank areas
- Numbers are consistently formatted across the app
- No unhandled errors crash the app (error boundary catches them)

## Task Tests

- [ ] Accessibility tests:
  - Test all buttons are focusable via Tab
  - Test modal opens/closes with keyboard (Enter to open, Escape to close)
  - Test P&L has aria-label indicating direction (e.g., "Profit: +$500")
- [ ] Responsive tests:
  - Test layout stacks correctly at tablet breakpoint
  - Test table is scrollable at narrow widths
- [ ] Number formatting tests (`frontend/src/utils/format.test.ts`):
  - Test formatUSD: 1234.5 → "$1,234.50"
  - Test formatUSD: negative → "-$500.00"
  - Test formatCrypto: 0.00100000 → "0.001"
  - Test formatPercent: 12.345 → "+12.35%"
  - Test formatPercent: -5.6 → "-5.60%"
- [ ] Edge case tests:
  - Test empty portfolio renders empty state
  - Test single holding shows 100% allocation
  - Test very large value displays correctly

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT FINISHED</critical>

## Relevant Files

- All `frontend/src/components/*.tsx` files (accessibility + responsive updates)
- `frontend/src/utils/format.ts` (new: number formatting)
- `frontend/src/components/ErrorBoundary.tsx` (new)
- `frontend/src/components/LoadingSkeleton.tsx` (new)
- `frontend/src/App.tsx` (wrap with ErrorBoundary)

## LINEAR
- []
- []
