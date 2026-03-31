package coingecko

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cooper/crypto-portfolio-tracker/domain/portfolio"
)

func TestGetPrices(t *testing.T) {
	tests := []struct {
		name       string
		coinIDs    []string
		status     int
		body       string
		want       map[string]portfolio.PriceData
		wantErr    bool
	}{
		{
			name:    "successful price fetch",
			coinIDs: []string{"bitcoin", "ethereum"},
			status:  http.StatusOK,
			body: `{
				"bitcoin": {"usd": 67000.50, "usd_24h_change": 2.5, "last_updated_at": 1700000000},
				"ethereum": {"usd": 3500.25, "usd_24h_change": -1.2, "last_updated_at": 1700000001}
			}`,
			want: map[string]portfolio.PriceData{
				"bitcoin":  {USD: 67000.50, USD24hChange: 2.5, LastUpdatedAt: 1700000000},
				"ethereum": {USD: 3500.25, USD24hChange: -1.2, LastUpdatedAt: 1700000001},
			},
		},
		{
			name:    "empty coin IDs returns empty map",
			coinIDs: []string{},
			status:  http.StatusOK,
			body:    `{}`,
			want:    map[string]portfolio.PriceData{},
		},
		{
			name:    "rate limited returns error",
			coinIDs: []string{"bitcoin"},
			status:  http.StatusTooManyRequests,
			body:    `{"status":{"error_message":"Rate limit exceeded"}}`,
			wantErr: true,
		},
		{
			name:    "server error returns error",
			coinIDs: []string{"bitcoin"},
			status:  http.StatusInternalServerError,
			body:    `{"error":"internal server error"}`,
			wantErr: true,
		},
		{
			name:    "invalid JSON returns error",
			coinIDs: []string{"bitcoin"},
			status:  http.StatusOK,
			body:    `not json`,
			wantErr: true,
		},
		{
			name:    "single coin",
			coinIDs: []string{"solana"},
			status:  http.StatusOK,
			body:    `{"solana": {"usd": 150.0, "usd_24h_change": 5.3, "last_updated_at": 1700000010}}`,
			want: map[string]portfolio.PriceData{
				"solana": {USD: 150.0, USD24hChange: 5.3, LastUpdatedAt: 1700000010},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Header.Get("x-cg-demo-api-key") != "test-key" {
					t.Error("missing or incorrect API key header")
				}
				if r.Header.Get("Accept") != "application/json" {
					t.Error("missing Accept header")
				}
				w.WriteHeader(tt.status)
				_, writeErr := w.Write([]byte(tt.body))
				if writeErr != nil {
					t.Fatalf("failed to write response: %v", writeErr)
				}
			}))
			defer server.Close()

			pricer := NewPricer(server.Client(), server.URL, "test-key")
			got, err := pricer.GetPrices(context.Background(), tt.coinIDs)

			if tt.wantErr {
				if err == nil {
					t.Fatal("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if len(got) != len(tt.want) {
				t.Fatalf("got %d prices, want %d", len(got), len(tt.want))
			}
			for coinID, wantData := range tt.want {
				gotData, ok := got[coinID]
				if !ok {
					t.Errorf("missing price for %s", coinID)
					continue
				}
				if gotData.USD != wantData.USD {
					t.Errorf("%s USD = %f, want %f", coinID, gotData.USD, wantData.USD)
				}
				if gotData.USD24hChange != wantData.USD24hChange {
					t.Errorf("%s USD24hChange = %f, want %f", coinID, gotData.USD24hChange, wantData.USD24hChange)
				}
				if gotData.LastUpdatedAt != wantData.LastUpdatedAt {
					t.Errorf("%s LastUpdatedAt = %d, want %d", coinID, gotData.LastUpdatedAt, wantData.LastUpdatedAt)
				}
			}
		})
	}
}

func TestGetPricesQueryParams(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()
		if got := query.Get("ids"); got != "bitcoin,ethereum" {
			t.Errorf("ids = %q, want %q", got, "bitcoin,ethereum")
		}
		if got := query.Get("vs_currencies"); got != "usd" {
			t.Errorf("vs_currencies = %q, want %q", got, "usd")
		}
		if got := query.Get("include_24hr_change"); got != "true" {
			t.Errorf("include_24hr_change = %q, want %q", got, "true")
		}
		if got := query.Get("include_last_updated_at"); got != "true" {
			t.Errorf("include_last_updated_at = %q, want %q", got, "true")
		}
		w.WriteHeader(http.StatusOK)
		_, writeErr := w.Write([]byte(`{}`))
		if writeErr != nil {
			t.Fatalf("failed to write response: %v", writeErr)
		}
	}))
	defer server.Close()

	pricer := NewPricer(server.Client(), server.URL, "test-key")
	_, err := pricer.GetPrices(context.Background(), []string{"bitcoin", "ethereum"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestFetchCoinList(t *testing.T) {
	tests := []struct {
		name    string
		status  int
		body    string
		want    []portfolio.Coin
		wantErr bool
	}{
		{
			name:   "successful coin list fetch",
			status: http.StatusOK,
			body:   `[{"id":"bitcoin","symbol":"btc","name":"Bitcoin"},{"id":"ethereum","symbol":"eth","name":"Ethereum"}]`,
			want: []portfolio.Coin{
				{CoinGeckoID: "bitcoin", Symbol: "btc", Name: "Bitcoin"},
				{CoinGeckoID: "ethereum", Symbol: "eth", Name: "Ethereum"},
			},
		},
		{
			name:   "empty list",
			status: http.StatusOK,
			body:   `[]`,
			want:   []portfolio.Coin{},
		},
		{
			name:    "rate limited returns error",
			status:  http.StatusTooManyRequests,
			body:    `{"status":{"error_message":"Rate limit exceeded"}}`,
			wantErr: true,
		},
		{
			name:    "invalid JSON returns error",
			status:  http.StatusOK,
			body:    `not json`,
			wantErr: true,
		},
		{
			name:    "server error returns error",
			status:  http.StatusBadGateway,
			body:    `bad gateway`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Header.Get("x-cg-demo-api-key") != "test-key" {
					t.Error("missing or incorrect API key header")
				}
				w.WriteHeader(tt.status)
				_, writeErr := w.Write([]byte(tt.body))
				if writeErr != nil {
					t.Fatalf("failed to write response: %v", writeErr)
				}
			}))
			defer server.Close()

			pricer := NewPricer(server.Client(), server.URL, "test-key")
			got, err := pricer.FetchCoinList(context.Background())

			if tt.wantErr {
				if err == nil {
					t.Fatal("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if len(got) != len(tt.want) {
				t.Fatalf("got %d coins, want %d", len(got), len(tt.want))
			}
			for i, wantCoin := range tt.want {
				if got[i] != wantCoin {
					t.Errorf("coin[%d] = %+v, want %+v", i, got[i], wantCoin)
				}
			}
		})
	}
}

func TestFetchCoinListEndpoint(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/coins/list" {
			t.Errorf("path = %q, want %q", r.URL.Path, "/coins/list")
		}
		w.WriteHeader(http.StatusOK)
		_, writeErr := w.Write([]byte(`[]`))
		if writeErr != nil {
			t.Fatalf("failed to write response: %v", writeErr)
		}
	}))
	defer server.Close()

	pricer := NewPricer(server.Client(), server.URL, "test-key")
	_, err := pricer.FetchCoinList(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestNewPricerTrimsTrailingSlash(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/coins/list" {
			t.Errorf("path = %q, want %q", r.URL.Path, "/coins/list")
		}
		w.WriteHeader(http.StatusOK)
		_, writeErr := w.Write([]byte(`[]`))
		if writeErr != nil {
			t.Fatalf("failed to write response: %v", writeErr)
		}
	}))
	defer server.Close()

	pricer := NewPricer(server.Client(), server.URL+"/", "test-key")
	_, err := pricer.FetchCoinList(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestCancelledContext(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, writeErr := w.Write([]byte(`{}`))
		if writeErr != nil {
			t.Fatalf("failed to write response: %v", writeErr)
		}
	}))
	defer server.Close()

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	pricer := NewPricer(server.Client(), server.URL, "test-key")
	_, err := pricer.GetPrices(ctx, []string{"bitcoin"})
	if err == nil {
		t.Fatal("expected error for cancelled context, got nil")
	}
}
