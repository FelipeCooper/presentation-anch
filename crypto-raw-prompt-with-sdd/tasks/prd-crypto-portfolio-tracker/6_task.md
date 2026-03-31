# Task 6.0: Frontend Scaffold & API Layer

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Initialize the Vite + React + TypeScript project with Tailwind CSS, configure TanStack Query, define shared TypeScript types, and create all API hooks (useHoldings, usePrices, useCoins) using native fetch. This task sets up the frontend foundation so that UI tasks (7.0, 8.0) can build on top.

<requirements>
- Vite project in `frontend/` with React and TypeScript strict mode
- Tailwind CSS configured
- TanStack Query (react-query) set up with QueryClientProvider in main.tsx
- Vite dev server proxy for `/api` → Go backend (default localhost:8080)
- Shared TypeScript types: Holding, PriceData, Coin (matching backend JSON)
- useHoldings hook: list, create, update, delete mutations with cache invalidation
- usePrices hook: polling at 180s refetchInterval
- useCoins hook: search with debounced query parameter
- Native fetch for all HTTP calls (no axios)
- No `any` in TypeScript — all types explicit
- No `console.log` — use a logger utility or remove
- No default exports in components (use named exports)
</requirements>

## Subtasks

- [ ] 6.1 Initialize Vite project: `npm create vite@latest frontend -- --template react-ts`
- [ ] 6.2 Install and configure Tailwind CSS (v4), TanStack Query, Recharts
- [ ] 6.3 Configure `vite.config.ts` with API proxy: `/api` → `http://localhost:8080`
- [ ] 6.4 Create `frontend/src/types/index.ts` with Holding, PriceData, Coin interfaces
- [ ] 6.5 Create `frontend/src/api/client.ts` — typed fetch wrapper with error handling (throws on non-OK responses, parses JSON)
- [ ] 6.6 Create `frontend/src/hooks/useHoldings.ts` — useQuery for list, useMutation for create/update/delete with query invalidation
- [ ] 6.7 Create `frontend/src/hooks/usePrices.ts` — useQuery with refetchInterval: 180000
- [ ] 6.8 Create `frontend/src/hooks/useCoins.ts` — useQuery with debounced search term, enabled only when query >= 2 chars
- [ ] 6.9 Create `frontend/src/main.tsx` — entry point with QueryClientProvider
- [ ] 6.10 Create `frontend/src/App.tsx` — basic layout shell (header + main content area)
- [ ] 6.11 Verify `npm run build` succeeds with no TypeScript errors

## Implementation Details

Refer to **techspec.md** sections:
- "Frontend types" for the exact TypeScript interfaces
- "API Endpoints" table for all routes and request/response shapes
- "Data flow" for how frontend interacts with backend
- "Standards Compliance" for fetch, no-any, no-console.log rules

Key points:
- TanStack Query keys: `["holdings"]` for holdings list, `["prices"]` for prices, `["coins", query]` for coin search
- After create/update/delete mutation succeeds, invalidate `["holdings"]` query
- usePrices should be enabled only when there are holdings (pass enabled option)
- Coin search should debounce the query input by ~300ms before firing the request
- API client should handle error responses: parse `{"error": "message"}` and throw typed errors
- Vite proxy config in `vite.config.ts`:
  ```ts
  server: { proxy: { '/api': 'http://localhost:8080' } }
  ```

## Success Criteria

- `npm run build` in `frontend/` completes with zero errors
- `npm run dev` starts Vite dev server with working API proxy
- All TypeScript types match the backend JSON format
- Hooks are correctly typed with no `any` usage
- TanStack Query is properly configured with QueryClientProvider

## Task Tests

- [ ] Unit tests for API client (`frontend/src/api/client.test.ts`):
  - Test successful fetch returns parsed JSON
  - Test non-OK response throws error with message from body
  - Test network error is propagated
- [ ] Unit tests for hooks (`frontend/src/hooks/*.test.ts`):
  - Test useHoldings returns data from GET /api/holdings
  - Test useHoldings create mutation calls POST /api/holdings
  - Test usePrices polls at the configured interval
  - Test useCoins only fires when query >= 2 chars
- [ ] TypeScript compilation check: `npx tsc --noEmit` passes with zero errors

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT FINISHED</critical>

## Relevant Files

- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/tsconfig.json`
- `frontend/src/main.tsx`
- `frontend/src/App.tsx`
- `frontend/src/types/index.ts`
- `frontend/src/api/client.ts`
- `frontend/src/hooks/useHoldings.ts`
- `frontend/src/hooks/usePrices.ts`
- `frontend/src/hooks/useCoins.ts`

## LINEAR
- []
- []
