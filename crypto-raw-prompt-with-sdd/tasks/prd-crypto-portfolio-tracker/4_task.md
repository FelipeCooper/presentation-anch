# Task 4.0: Foundation Implementation — CoinGecko Pricer

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Implement the domain's `AssetPricer` interface by calling the CoinGecko Demo API's `/simple/price` endpoint. Also implement a coin list fetcher that calls `/coins/list` for the background refresh. Handle rate limiting, timeouts, and error scenarios gracefully.

<requirements>
- Implementation of `domain/portfolio.AssetPricer` using CoinGecko `/simple/price`
- Authentication via `x-cg-demo-api-key` header with key from config
- Request parameters: `ids={csv}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
- Coin list fetcher function calling `/coins/list` returning `[]portfolio.Coin`
- On HTTP 429 (rate limit): return last cached prices with stale indicator (not an error)
- On 5xx or timeout: return cached data with error flag
- Cache last-known prices in memory so stale data can be served on failure
- HTTP client timeout: 10s (from foundation httpclient)
- Base URL: `https://api.coingecko.com/api/v3`
- Tests using httptest.Server to mock CoinGecko responses
</requirements>

## Subtasks

- [ ] 4.1 Create `foundation/coingecko/pricer.go` — struct implementing `portfolio.AssetPricer`, taking HTTP client and API key via constructor
- [ ] 4.2 Implement `GetPrices` — build URL with comma-separated coin IDs, parse JSON response into `map[string]PriceData`
- [ ] 4.3 Implement in-memory price cache — store last successful response, serve on failure
- [ ] 4.4 Handle error scenarios: 429 (return cached + log warning), 5xx (return cached + log error), timeout (return cached + log error), empty coin list (return empty map)
- [ ] 4.5 Create `foundation/coingecko/coins.go` — `FetchCoinList` function calling `/coins/list`, parsing into `[]portfolio.Coin`
- [ ] 4.6 Write unit tests with httptest.Server

## Implementation Details

Refer to **techspec.md** sections:
- "Integration Points > CoinGecko Demo API" for base URL, auth header, endpoints, rate limits, error handling
- "Key Interfaces" for AssetPricer interface and PriceData struct
- "Known Risks" for CoinGecko downtime and rate limit mitigation

Key points:
- CoinGecko `/simple/price` response format:
  ```json
  {"bitcoin":{"usd":50000,"usd_24h_change":-2.5,"last_updated_at":1700000000}}
  ```
- Map this to `PriceData{USD: 50000, USD24hChange: -2.5, LastUpdatedAt: 1700000000}`
- The cache is a simple `map[string]PriceData` protected by a `sync.RWMutex`
- Constructor: `func NewPricer(client *http.Client, apiKey string, logger *slog.Logger) *Pricer`
- `/coins/list` response format: `[{"id":"bitcoin","symbol":"btc","name":"Bitcoin"}, ...]`

## Success Criteria

- GetPrices returns correct PriceData for multiple coins from a successful API call
- On rate limit (429), cached prices are returned without error
- On server error (5xx), cached prices are returned without error
- On timeout, cached prices are returned without error
- Empty coin ID list returns empty map (no API call made)
- FetchCoinList parses the full coin list correctly
- All tests pass using httptest.Server mocks

## Task Tests

- [ ] Unit tests for Pricer (`foundation/coingecko/pricer_test.go`):
  - Test GetPrices happy path: mock returns valid JSON, verify parsed PriceData
  - Test GetPrices multiple coins: verify all coins parsed correctly
  - Test GetPrices empty list: returns empty map, no HTTP call made
  - Test GetPrices 429 response: returns cached data from previous successful call
  - Test GetPrices 500 response: returns cached data
  - Test GetPrices timeout: returns cached data
  - Test GetPrices no cache available on error: returns error
  - Test API key is sent in x-cg-demo-api-key header
- [ ] Unit tests for FetchCoinList (`foundation/coingecko/coins_test.go`):
  - Test happy path: parse coin list JSON
  - Test empty response: returns empty slice
  - Test error response: returns error

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT FINISHED</critical>

## Relevant Files

- `foundation/coingecko/pricer.go`
- `foundation/coingecko/coins.go`
- `foundation/coingecko/pricer_test.go`
- `foundation/coingecko/coins_test.go`
- `domain/portfolio/pricer.go` (interface to implement)

## LINEAR
- []
- []
