# Technical Specification: Crypto Portfolio Tracker

## Executive Summary

The Crypto Portfolio Tracker is a greenfield Go + React application following package-oriented DDD with three layers (foundation, domain, app). The Go backend exposes a REST API for CRUD operations on holdings and proxies price data from the CoinGecko Demo API, while a React/TypeScript frontend built with Vite renders a live dashboard with TanStack Query polling and Recharts visualizations. PostgreSQL persists holdings and a cached coin list. The frontend and backend are deployed as separate processes — Vite builds static assets served independently (e.g., via nginx), and the Go server is API-only.

## System Architecture

### Component Overview

**New components:**

- `foundation/database/` — pgxpool connection setup and golang-migrate migration runner
- `foundation/httpclient/` — Reusable HTTP client with timeout for CoinGecko API calls
- `foundation/logger/` — slog configuration
- `foundation/config/` — Environment variable loading (DB URL, CoinGecko API key, poll interval)
- `domain/portfolio/` — Holding entity, business logic, repository and pricer interfaces, service
- `app/server.go` — chi router setup, middleware, static file serving
- `app/handlers/portfolio.go` — HTTP handlers for holdings CRUD
- `app/handlers/prices.go` — HTTP handler proxying CoinGecko price requests
- `app/handlers/coins.go` — HTTP handler for coin search
- `app/wire.go` — Dependency injection wiring
- `frontend/` — Vite React+TypeScript SPA (dashboard, holdings table, allocation chart, add/edit forms)

**Data flow:**

1. Frontend polls `GET /api/prices` every 180s via TanStack Query → handler calls domain service → service calls `AssetPricer` interface → foundation httpclient fetches CoinGecko `/simple/price` → response cached and returned
2. Frontend CRUD calls (`POST/PUT/DELETE /api/holdings`) → handler validates input → domain service enforces business rules → repository persists to PostgreSQL
3. Frontend coin search `GET /api/coins?q=bit` → handler queries cached coins table → returns matching coins

## Implementation Design

### Key Interfaces

```go
// domain/portfolio/repository.go
type Repository interface {
    List(ctx context.Context) ([]Holding, error)
    Get(ctx context.Context, id string) (Holding, error)
    Create(ctx context.Context, h Holding) (Holding, error)
    Update(ctx context.Context, h Holding) (Holding, error)
    Delete(ctx context.Context, id string) error
    ExistsByCoinID(ctx context.Context, coinGeckoID string) (bool, error)
}
```

```go
// domain/portfolio/pricer.go
type AssetPricer interface {
    GetPrices(ctx context.Context, coinIDs []string) (map[string]PriceData, error)
}

type PriceData struct {
    USD            float64
    USD24hChange   float64
    LastUpdatedAt  int64
}
```

```go
// domain/portfolio/coin_store.go
type CoinStore interface {
    Search(ctx context.Context, query string, limit int) ([]Coin, error)
    RefreshCoins(ctx context.Context, coins []Coin) error
}
```

### Data Models

**Domain entities (`domain/portfolio/portfolio.go`):**

```go
type Holding struct {
    ID              string
    CoinGeckoID     string
    Symbol          string
    Name            string
    Quantity        float64
    AvgPurchasePrice float64 // USD cost basis per unit
    CreatedAt       time.Time
    UpdatedAt       time.Time
}

type Coin struct {
    CoinGeckoID string
    Symbol      string
    Name        string
}
```

**Database schema (`foundation/database/migrations/`):**

```sql
-- 000001_create_holdings.up.sql
CREATE TABLE holdings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coingecko_id    TEXT NOT NULL UNIQUE,
    symbol          TEXT NOT NULL,
    name            TEXT NOT NULL,
    quantity        NUMERIC NOT NULL CHECK (quantity > 0),
    avg_purchase_price NUMERIC NOT NULL CHECK (avg_purchase_price > 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 000002_create_coins.up.sql
CREATE TABLE coins (
    coingecko_id TEXT PRIMARY KEY,
    symbol       TEXT NOT NULL,
    name         TEXT NOT NULL
);
CREATE INDEX idx_coins_name_trgm ON coins USING gin (name gin_trgm_ops);
CREATE INDEX idx_coins_symbol ON coins (symbol);
```

The `pg_trgm` extension enables fuzzy text search on coin names for the searchable selector.

**Frontend types (`frontend/src/types/`):**

```typescript
interface Holding {
  id: string;
  coingeckoId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPurchasePrice: number;
  createdAt: string;
  updatedAt: string;
}

interface PriceData {
  usd: number;
  usd24hChange: number;
  lastUpdatedAt: number;
}

interface Coin {
  coingeckoId: string;
  symbol: string;
  name: string;
}
```

### API Endpoints

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/holdings` | List all holdings | — | `Holding[]` |
| `POST` | `/api/holdings` | Create a holding | `{coingeckoId, symbol, name, quantity, avgPurchasePrice}` | `Holding` |
| `PUT` | `/api/holdings/{id}` | Update quantity/price | `{quantity, avgPurchasePrice}` | `Holding` |
| `DELETE` | `/api/holdings/{id}` | Delete a holding | — | `204 No Content` |
| `GET` | `/api/prices` | Get live prices for all held assets | — | `map[string]PriceData` |
| `GET` | `/api/coins?q={query}` | Search coins by name/symbol | — | `Coin[]` (max 20) |

All endpoints return JSON. Errors use a consistent `{"error": "message"}` format with appropriate HTTP status codes (400, 404, 409 for duplicate, 500, 502 for upstream failures).

## Integration Points

### CoinGecko Demo API

- **Base URL:** `https://api.coingecko.com/api/v3`
- **Authentication:** `x-cg-demo-api-key` header with key from `COINGECKO_API_KEY` env var
- **Endpoints used:**
  - `GET /simple/price?ids={csv}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
  - `GET /coins/list` (for coin cache refresh)
- **Rate limiting:** 30 req/min, 10,000 req/month. The backend is the single caller — frontend never contacts CoinGecko directly.
- **Error handling:** On HTTP 429 (rate limited), return last cached prices to frontend with a stale-data indicator. On 5xx or timeout (10s), return cached data with error flag. Never lose previously displayed data.
- **Coin list refresh:** On startup, and then once every 24 hours via a background goroutine, fetch `/coins/list` and upsert into the `coins` table.

### PostgreSQL

- **Connection:** `pgxpool.Pool` initialized from `DATABASE_URL` env var
- **Migrations:** golang-migrate runs automatically on startup, reading SQL files from `foundation/database/migrations/`
- **Pool config:** MaxConns=10, MinConns=2 (single-user app, low concurrency)

## Testing Approach

### Unit Tests

- **Domain service** (`domain/portfolio/service_test.go`): Test all business rules — duplicate prevention, positive number validation, P&L calculations. Mock `Repository`, `AssetPricer`, and `CoinStore` interfaces.
- **Handlers** (`app/handlers/*_test.go`): Test HTTP status codes, request validation, JSON serialization. Mock domain service.
- **Foundation httpclient**: Test CoinGecko response parsing, error handling, timeout behavior using `httptest.Server`.

### Integration Tests

- **Repository tests** (`foundation/database/*_test.go`): Run against a real PostgreSQL instance (use `testcontainers-go` or a test database). Verify CRUD operations, unique constraints, and coin search.
- **Full handler→service→repository**: Wire real dependencies against test DB, verify end-to-end request/response cycles.

### E2E Tests

- **Playwright** tests covering:
  - Empty state → add first holding → verify dashboard updates
  - Edit holding → verify recalculated P&L
  - Delete holding → verify removal
  - Price refresh cycle (mock CoinGecko at network level or use MSW)
  - Allocation chart renders with correct proportions

## Development Sequencing

### Build Order

1. **Foundation layer** — database connection, migrations, config loading, logger, HTTP client. These are prerequisites for everything else.
2. **Domain layer** — Holding entity, interfaces, service with business logic. Can be fully unit-tested with mocks before any infrastructure exists.
3. **Backend API** — chi router, handlers, wire.go. Connect foundation implementations to domain interfaces.
4. **CoinGecko integration** — Pricer implementation, coin list cache, background refresh goroutine.
5. **Frontend scaffold** — Vite project, TanStack Query setup, API proxy config, base layout with Tailwind, NEED TO BE SIMPLE.
6. **Holdings CRUD UI** — Add/edit/delete forms, holdings table, form validation.
7. **Dashboard** — Summary cards (total value, P&L), allocation donut chart (Recharts), live polling.
8. **Polish** — Error states, loading indicators, empty state, CoinGecko attribution, accessibility, responsive design.
9. **E2E tests** — Playwright test suite.

### Technical Dependencies

- PostgreSQL instance (local Docker or installed) must be available for development
- CoinGecko Demo API key (free, requires signup at coingecko.com)
- Node.js 20.19+ for Vite frontend tooling
- Go 1.22+ (latest stable)

## Monitoring and Observability

- **Structured logging** via `slog` at all layers:
  - `INFO`: Server start, price fetch success, holding CRUD operations
  - `WARN`: CoinGecko rate limit (429), stale price served, slow response (>5s)
  - `ERROR`: CoinGecko unreachable, database errors, migration failures
- **Metrics** (Prometheus format via `/metrics` endpoint):
  - `coingecko_requests_total{status}` — counter of API calls by HTTP status
  - `coingecko_request_duration_seconds` — histogram of API latency
  - `holdings_total` — gauge of current holding count
  - `price_staleness_seconds` — gauge of time since last successful price fetch
- **Health check:** `GET /healthz` — verifies database connectivity and returns 200/503

## Technical Considerations

### Key Decisions

| Decision | Justification | Alternatives Considered |
|----------|--------------|------------------------|
| 180s default poll interval | CoinGecko free tier is 10K calls/month. At 180s, continuous usage consumes ~14,400/month — leaves headroom for coin list refreshes and manual reloads. | 60s (PRD default, exceeds budget), 120s (tighter margin) |
| Coin list cached in DB | ~15,000 coins from `/coins/list`. DB storage survives restarts, enables trigram search, and avoids burning API credits on every form open. | In-memory cache (lost on restart), on-demand fetch (expensive) |
| Separate frontend/backend deployment | Frontend served independently (nginx/CDN), backend is API-only. More operational flexibility. | Go embeds static files (simpler single-binary, but couples deployments) |
| golang-migrate for migrations | First-class pgx driver, SQL-only migrations keep foundation layer clean of business logic. | pressly/goose (Go-function migrations mix concerns) |
| chi router | Lightweight, idiomatic, 100% `net/http` compatible. Built-in middleware for logging, recovery, CORS. | Standard `net/http` mux (less ergonomic for RESTful routes) |
| UUID primary keys | Avoids sequential ID enumeration. `gen_random_uuid()` is built into PostgreSQL. | Auto-increment integers (simpler but less secure/portable) |

### Known Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| CoinGecko rate limit exceeded | Stale prices displayed | Cache last-known prices, show staleness indicator, configurable interval |
| CoinGecko API downtime | No price updates | Serve cached prices with clear error banner, log warnings |
| `pg_trgm` extension unavailable | Coin search falls back to LIKE | Check for extension on startup, fall back to `ILIKE '%query%'` |
| Large coin list refresh blocks startup | Slow cold start | Run refresh in background goroutine after server starts listening |

### Standards Compliance

**From `.claude/rules/stack.md`:**
- Go backend with chi router and pgx driver ✓
- Config via `os.Getenv`, never hardcoded ✓
- Logging via `slog` ✓
- React + TypeScript strict mode, Vite, TanStack Query, Recharts, Tailwind CSS ✓
- Native `fetch` for HTTP client (no axios) ✓
- No `any` in TypeScript ✓
- No default exports in Go ✓
- All errors handled explicitly ✓
- No `console.log` — use foundation logger ✓

**From `.claude/rules/architeture.md`:**
- Three-layer architecture: foundation → domain ← app ✓
- Domain has zero external imports, defines its own interfaces ✓
- Foundation implements domain interfaces, contains no business logic ✓
- App layer is thin handlers: validate → call service → write response ✓
- `wire.go` is the single DI wiring point ✓

### Relevant and Dependent Files

```
foundation/
├── database/
│   ├── database.go              # pgxpool setup
│   ├── migrate.go               # golang-migrate runner
│   └── migrations/
│       ├── 000001_create_holdings.up.sql
│       ├── 000001_create_holdings.down.sql
│       ├── 000002_create_coins.up.sql
│       └── 000002_create_coins.down.sql
├── httpclient/
│   └── client.go                # HTTP client with timeout
├── logger/
│   └── logger.go                # slog configuration
└── config/
    └── config.go                # Env var loading

domain/
└── portfolio/
    ├── portfolio.go             # Holding and Coin entities, P&L logic
    ├── repository.go            # Repository interface
    ├── pricer.go                # AssetPricer interface + PriceData
    ├── coin_store.go            # CoinStore interface
    └── service.go               # Use cases (CRUD, price fetching, search)

app/
├── server.go                    # chi router, middleware, server startup
├── handlers/
│   ├── portfolio.go             # Holdings CRUD handlers
│   ├── prices.go                # Price proxy handler
│   └── coins.go                 # Coin search handler
└── wire.go                      # DI wiring

frontend/
├── vite.config.ts               # Vite config with API proxy
├── src/
│   ├── main.tsx                 # Entry point, QueryClientProvider
│   ├── App.tsx                  # Layout and routing
│   ├── types/
│   │   └── index.ts             # Shared TypeScript types
│   ├── hooks/
│   │   ├── useHoldings.ts       # TanStack Query hooks for holdings CRUD
│   │   ├── usePrices.ts         # Price polling hook (180s refetchInterval)
│   │   └── useCoins.ts          # Coin search hook
│   └── components/
│       ├── Dashboard.tsx         # Main layout: summary cards + table + chart
│       ├── HoldingsTable.tsx     # Holdings table with P&L columns
│       ├── AllocationChart.tsx   # Recharts donut chart
│       ├── SummaryCards.tsx      # Total value, cost basis, P&L cards
│       ├── HoldingForm.tsx       # Add/edit holding modal with coin search
│       └── EmptyState.tsx        # CTA when no holdings exist
```
