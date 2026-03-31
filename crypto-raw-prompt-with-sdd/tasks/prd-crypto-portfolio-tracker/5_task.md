# Task 5.0: Backend API — Server, Handlers & Wiring

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Create the app layer: chi router with middleware, HTTP handlers for all API endpoints, health check, dependency injection wiring, background coin list refresh goroutine, and the main.go entry point that starts the server.

<requirements>
- chi router with logging, recovery, and CORS middleware
- Holdings CRUD handlers: GET /api/holdings, POST /api/holdings, PUT /api/holdings/{id}, DELETE /api/holdings/{id}
- Prices handler: GET /api/prices
- Coins search handler: GET /api/coins?q={query}
- Health check: GET /healthz (verifies DB connectivity)
- Consistent error response format: {"error": "message"} with appropriate HTTP status codes (400, 404, 409, 500, 502)
- wire.go wiring all foundation implementations into domain interfaces
- Background goroutine: refresh coin list on startup, then every 24 hours
- main.go: load config, init logger, connect DB, run migrations, wire dependencies, start server
- Handlers are thin: validate input, call service, write JSON response
</requirements>

## Subtasks

- [ ] 5.1 Create `app/server.go` — chi router setup with middleware (logger, recoverer, CORS), route registration, server start
- [ ] 5.2 Create `app/handlers/portfolio.go` — handlers for GET/POST/PUT/DELETE /api/holdings
- [ ] 5.3 Create `app/handlers/prices.go` — handler for GET /api/prices (calls service to get prices for all held coins)
- [ ] 5.4 Create `app/handlers/coins.go` — handler for GET /api/coins?q={query} (max 20 results)
- [ ] 5.5 Create `app/handlers/health.go` — handler for GET /healthz (ping database)
- [ ] 5.6 Create `app/wire.go` — instantiate all foundation implementations, create domain service, return configured server
- [ ] 5.7 Create `main.go` — entry point: load config, init everything via wire.go, start background coin refresh, listen and serve
- [ ] 5.8 Write handler unit tests with mocked domain service

## Implementation Details

Refer to **techspec.md** sections:
- "API Endpoints" table for all routes, request/response formats
- "Data flow" for the request lifecycle
- "System Architecture > Component Overview" for app layer structure
- "Standards Compliance" for handler patterns (thin handlers, wire.go as single DI point)

Key points:
- POST /api/holdings request body: `{coingeckoId, symbol, name, quantity, avgPurchasePrice}` — validate all fields present and valid
- PUT /api/holdings/{id} request body: `{quantity, avgPurchasePrice}` — only these two fields are updatable
- DELETE /api/holdings/{id} returns 204 No Content on success
- GET /api/prices: list all holdings, extract coin IDs, call pricer, return map
- GET /api/coins?q=: if query is empty or less than 2 chars, return empty array
- Map domain errors to HTTP status codes: ErrNotFound→404, ErrDuplicateHolding→409, ErrInvalidInput→400
- CORS: allow all origins for development (configurable)
- Background coin refresh: `go func() { refresh(); ticker := time.NewTicker(24h); for range ticker.C { refresh() } }()`

## Success Criteria

- All API endpoints return correct status codes and JSON format
- Error responses use consistent `{"error": "message"}` format
- Health check returns 200 when DB is reachable, 503 when not
- Handlers correctly delegate to domain service (no business logic in handlers)
- wire.go correctly wires all dependencies
- Server starts successfully and accepts requests
- Background coin refresh runs on startup

## Task Tests

- [ ] Handler unit tests (`app/handlers/portfolio_test.go`):
  - Test POST /api/holdings: valid input returns 201 + created holding
  - Test POST /api/holdings: missing fields returns 400
  - Test POST /api/holdings: duplicate coin returns 409
  - Test GET /api/holdings: returns list of holdings
  - Test PUT /api/holdings/{id}: valid input returns 200 + updated holding
  - Test PUT /api/holdings/{id}: not found returns 404
  - Test DELETE /api/holdings/{id}: returns 204
  - Test DELETE /api/holdings/{id}: not found returns 404
- [ ] Handler unit tests (`app/handlers/prices_test.go`):
  - Test GET /api/prices: returns price map for held coins
  - Test GET /api/prices: no holdings returns empty map
- [ ] Handler unit tests (`app/handlers/coins_test.go`):
  - Test GET /api/coins?q=bit: returns matching coins
  - Test GET /api/coins (no query): returns empty array
- [ ] Handler unit tests (`app/handlers/health_test.go`):
  - Test GET /healthz: DB reachable returns 200
  - Test GET /healthz: DB unreachable returns 503

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT FINISHED</critical>

## Relevant Files

- `app/server.go`
- `app/handlers/portfolio.go`
- `app/handlers/prices.go`
- `app/handlers/coins.go`
- `app/handlers/health.go`
- `app/wire.go`
- `main.go`
- `app/handlers/portfolio_test.go`
- `app/handlers/prices_test.go`
- `app/handlers/coins_test.go`
- `app/handlers/health_test.go`

## LINEAR
- []
- []
