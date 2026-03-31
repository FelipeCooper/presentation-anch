# Task 2.0: Domain Layer — Entities, Interfaces & Service

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Create the domain layer with Holding and Coin entities, define the Repository, AssetPricer, and CoinStore interfaces, and implement the Service with all business logic. This task has zero external dependencies — the domain layer uses only the Go standard library and defines its own interfaces.

<requirements>
- Holding entity with all fields (ID, CoinGeckoID, Symbol, Name, Quantity, AvgPurchasePrice, CreatedAt, UpdatedAt)
- Coin entity with fields (CoinGeckoID, Symbol, Name)
- PriceData struct (USD, USD24hChange, LastUpdatedAt)
- Repository interface with List, Get, Create, Update, Delete, ExistsByCoinID methods
- AssetPricer interface with GetPrices method
- CoinStore interface with Search and RefreshCoins methods
- Service implementing all use cases: create holding (with duplicate check + validation), update holding (with validation), delete holding, list holdings, get prices, search coins
- Business rule: quantity and avgPurchasePrice must be positive numbers
- Business rule: only one holding per CoinGecko ID (duplicate prevention)
- P&L calculation logic: cost basis = quantity * avgPurchasePrice, current value = quantity * currentPrice
- Domain layer has ZERO imports from foundation or app packages
</requirements>

## Subtasks

- [ ] 2.1 Create `domain/portfolio/portfolio.go` — Holding and Coin structs, P&L calculation methods on Holding
- [ ] 2.2 Create `domain/portfolio/repository.go` — Repository interface as defined in tech spec
- [ ] 2.3 Create `domain/portfolio/pricer.go` — AssetPricer interface and PriceData struct
- [ ] 2.4 Create `domain/portfolio/coin_store.go` — CoinStore interface
- [ ] 2.5 Create `domain/portfolio/service.go` — Service struct taking Repository, AssetPricer, CoinStore via constructor; implement all use case methods
- [ ] 2.6 Write comprehensive unit tests with mock implementations of all interfaces

## Implementation Details

Refer to **techspec.md** sections:
- "Key Interfaces" for exact interface signatures
- "Data Models > Domain entities" for Holding and Coin structs
- "Standards Compliance" for naming conventions (don't repeat package name)

Key points:
- Name the service type `Service` (not `PortfolioService`) per naming conventions
- Constructor: `func NewService(repo Repository, pricer AssetPricer, coins CoinStore) *Service`
- Create method must call `repo.ExistsByCoinID()` before creating to prevent duplicates — return a domain error if duplicate
- Define domain-specific error types (e.g., `ErrDuplicateHolding`, `ErrNotFound`, `ErrInvalidInput`)
- P&L helper methods on Holding: `CostBasis() float64`, `CurrentValue(price float64) float64`, `PnL(price float64) float64`, `PnLPercent(price float64) float64`

## Success Criteria

- `go build ./domain/...` succeeds with zero external imports
- All business rules are enforced in the Service (duplicate prevention, positive number validation)
- P&L calculations are correct for various scenarios (gain, loss, zero)
- All unit tests pass with 100% coverage of business logic paths

## Task Tests

- [ ] Unit tests for `domain/portfolio/service_test.go`:
  - Test Create: happy path, duplicate coin rejection, zero/negative quantity rejection, zero/negative price rejection
  - Test Update: happy path, not found error, invalid quantity/price
  - Test Delete: happy path, not found error
  - Test List: returns all holdings from repository
  - Test GetPrices: delegates to AssetPricer, handles empty holdings list
  - Test SearchCoins: delegates to CoinStore with query and limit
- [ ] Unit tests for P&L calculation methods:
  - Test CostBasis calculation
  - Test CurrentValue calculation
  - Test PnL (positive gain, negative loss, break even)
  - Test PnLPercent (positive, negative, zero cost basis edge case)

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT FINISHED</critical>

## Relevant Files

- `domain/portfolio/portfolio.go`
- `domain/portfolio/repository.go`
- `domain/portfolio/pricer.go`
- `domain/portfolio/coin_store.go`
- `domain/portfolio/service.go`
- `domain/portfolio/service_test.go`

## LINEAR
- []
- []
