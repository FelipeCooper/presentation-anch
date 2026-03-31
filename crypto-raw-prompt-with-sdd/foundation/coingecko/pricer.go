// Package coingecko implements the portfolio.AssetPricer interface
// by fetching live price data from the CoinGecko Demo API.
// It also provides coin list fetching for populating the coin cache.
package coingecko

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/cooper/crypto-portfolio-tracker/domain/portfolio"
)

// Pricer fetches cryptocurrency prices from the CoinGecko API.
type Pricer struct {
	client  *http.Client
	baseURL string
	apiKey  string
}

// NewPricer creates a Pricer with the given HTTP client, base URL, and API key.
func NewPricer(client *http.Client, baseURL string, apiKey string) *Pricer {
	return &Pricer{
		client:  client,
		baseURL: strings.TrimRight(baseURL, "/"),
		apiKey:  apiKey,
	}
}

// priceResponse represents the CoinGecko /simple/price JSON structure.
// Each key is a coin ID mapping to its price data.
type priceResponse map[string]struct {
	USD           float64 `json:"usd"`
	USD24hChange  float64 `json:"usd_24h_change"`
	LastUpdatedAt int64   `json:"last_updated_at"`
}

// GetPrices fetches current USD prices for the given coin IDs from CoinGecko.
func (p *Pricer) GetPrices(ctx context.Context, coinIDs []string) (map[string]portfolio.PriceData, error) {
	if len(coinIDs) == 0 {
		return map[string]portfolio.PriceData{}, nil
	}

	url := fmt.Sprintf("%s/simple/price?ids=%s&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true",
		p.baseURL, strings.Join(coinIDs, ","))

	body, err := p.doRequest(ctx, url)
	if err != nil {
		return nil, fmt.Errorf("fetching prices: %w", err)
	}

	var raw priceResponse
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, fmt.Errorf("parsing price response: %w", err)
	}

	result := make(map[string]portfolio.PriceData, len(raw))
	for coinID, data := range raw {
		result[coinID] = portfolio.PriceData{
			USD:           data.USD,
			USD24hChange:  data.USD24hChange,
			LastUpdatedAt: data.LastUpdatedAt,
		}
	}
	return result, nil
}

// coinListEntry represents a single entry from the CoinGecko /coins/list endpoint.
type coinListEntry struct {
	ID     string `json:"id"`
	Symbol string `json:"symbol"`
	Name   string `json:"name"`
}

// FetchCoinList retrieves the full list of coins from CoinGecko for caching.
func (p *Pricer) FetchCoinList(ctx context.Context) ([]portfolio.Coin, error) {
	url := fmt.Sprintf("%s/coins/list", p.baseURL)

	body, err := p.doRequest(ctx, url)
	if err != nil {
		return nil, fmt.Errorf("fetching coin list: %w", err)
	}

	var entries []coinListEntry
	if err := json.Unmarshal(body, &entries); err != nil {
		return nil, fmt.Errorf("parsing coin list response: %w", err)
	}

	coins := make([]portfolio.Coin, len(entries))
	for i, e := range entries {
		coins[i] = portfolio.Coin{
			CoinGeckoID: e.ID,
			Symbol:      e.Symbol,
			Name:        e.Name,
		}
	}
	return coins, nil
}

// doRequest executes an authenticated GET request and returns the response body.
func (p *Pricer) doRequest(ctx context.Context, url string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("x-cg-demo-api-key", p.apiKey)
	req.Header.Set("Accept", "application/json")

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading response body: %w", err)
	}

	if resp.StatusCode == http.StatusTooManyRequests {
		return nil, fmt.Errorf("rate limited by CoinGecko (HTTP 429)")
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d: %s", resp.StatusCode, string(body))
	}

	return body, nil
}
