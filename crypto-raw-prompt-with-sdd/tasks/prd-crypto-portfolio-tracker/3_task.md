# Task 3.0: Foundation Implementations — Repository & CoinStore

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Implement the domain's `Repository` and `CoinStore` interfaces using PostgreSQL (pgx). These are foundation-layer packages that satisfy the contracts defined in the domain layer. Integration tests run against a real PostgreSQL instance.

<requirements>
- PostgreSQL-based implementation of `domain/portfolio.Repository` with all 6 methods
- PostgreSQL-based implementation of `domain/portfolio.CoinStore` with Search and RefreshCoins
- All SQL queries use parameterized statements (no string concatenation)
- Repository respects the UNIQUE constraint on coingecko_id
- CoinStore.Search uses pg_trgm trigram matching when available, falls back to ILIKE
- CoinStore.RefreshCoins upserts the full coin list (INSERT ON CONFLICT DO UPDATE)
- Integration tests against real PostgreSQL
</requirements>

## Subtasks

- [ ] 3.1 Create `foundation/database/repository.go` — implement `portfolio.Repository` using pgxpool
- [ ] 3.2 Create `foundation/database/coin_store.go` — implement `portfolio.CoinStore` using pgxpool
- [ ] 3.3 Implement `Search` with trigram similarity query (`similarity(name, $1) > 0.1 OR symbol ILIKE $1`) ordered by relevance, limited to 20 results
- [ ] 3.4 Implement `RefreshCoins` with batch upsert using `INSERT ... ON CONFLICT (coingecko_id) DO UPDATE SET symbol=EXCLUDED.symbol, name=EXCLUDED.name`
- [ ] 3.5 Write integration tests for all Repository methods
- [ ] 3.6 Write integration tests for CoinStore Search and RefreshCoins

## Implementation Details

Refer to **techspec.md** sections:
- "Key Interfaces" for the exact interface signatures to implement
- "Data Models > Database schema" for table structures and column types
- "Known Risks" for pg_trgm fallback strategy
- "Testing Approach > Integration Tests" for test database approach

Key points:
- Use `pgxpool.Pool` passed via constructor: `func NewRepository(pool *pgxpool.Pool) *Repository`
- Map database UUID to string in Go (scan as `pgtype.UUID`, convert to string)
- Handle `pgx.ErrNoRows` → return domain `ErrNotFound`
- Handle unique constraint violation → return domain `ErrDuplicateHolding`
- For CoinStore.Search, check if pg_trgm is available at startup; if not, use `ILIKE '%' || $1 || '%'`
- RefreshCoins should handle large lists (15,000+ coins) — use batch insert with a transaction

## Success Criteria

- Repository correctly implements all 6 interface methods
- CoinStore correctly implements Search (with fuzzy matching) and RefreshCoins (upsert)
- Unique constraint violations return appropriate domain errors
- All integration tests pass against a real PostgreSQL database
- No SQL injection vulnerabilities (all queries parameterized)

## Task Tests

- [ ] Integration tests for Repository (`foundation/database/repository_test.go`):
  - Test Create: inserts holding, returns it with generated UUID and timestamps
  - Test Create duplicate: same coingecko_id returns error
  - Test Get: retrieves holding by ID
  - Test Get not found: returns ErrNotFound
  - Test List: returns all holdings
  - Test Update: modifies quantity and price, updates updated_at
  - Test Update not found: returns ErrNotFound
  - Test Delete: removes holding
  - Test Delete not found: returns ErrNotFound
  - Test ExistsByCoinID: returns true/false correctly
- [ ] Integration tests for CoinStore (`foundation/database/coin_store_test.go`):
  - Test RefreshCoins: inserts new coins, updates existing coins on conflict
  - Test Search by name: returns matching coins ordered by relevance
  - Test Search by symbol: returns matching coins
  - Test Search limit: respects the max results parameter
  - Test Search empty query: returns empty results

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT FINISHED</critical>

## Relevant Files

- `foundation/database/repository.go`
- `foundation/database/coin_store.go`
- `foundation/database/repository_test.go`
- `foundation/database/coin_store_test.go`
- `domain/portfolio/repository.go` (interface to implement)
- `domain/portfolio/coin_store.go` (interface to implement)

## LINEAR
- []
- []
