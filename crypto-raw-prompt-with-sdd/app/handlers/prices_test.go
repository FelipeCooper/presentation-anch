package handlers_test

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/cooper/crypto-portfolio-tracker/app/handlers"
	"github.com/cooper/crypto-portfolio-tracker/domain/portfolio"
	"github.com/go-chi/chi/v5"
)

func setupPricesRouter(repo *mockRepository, pricer *mockPricer) *chi.Mux {
	svc := portfolio.NewService(repo, pricer, &mockCoinStore{})
	log := newTestLogger()
	h := handlers.NewPrices(svc, log)

	r := chi.NewRouter()
	r.Get("/api/prices", h.Get)
	return r
}

func TestPrices_Get_WithHoldings(t *testing.T) {
	repo := newMockRepository()
	repo.holdings["id-1"] = portfolio.Holding{
		ID: "id-1", CoinGeckoID: "bitcoin",
		Quantity: 1, AvgPurchasePrice: 40000,
		CreatedAt: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
		UpdatedAt: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
	}
	pricer := &mockPricer{
		prices: map[string]portfolio.PriceData{
			"bitcoin": {USD: 65000, USD24hChange: 2.5, LastUpdatedAt: 1700000000},
		},
	}
	r := setupPricesRouter(repo, pricer)

	req := httptest.NewRequest(http.MethodGet, "/api/prices", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}

	var resp map[string]map[string]interface{}
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	btc, ok := resp["bitcoin"]
	if !ok {
		t.Fatal("expected bitcoin in response")
	}
	if btc["usd"] != 65000.0 {
		t.Errorf("usd = %v, want 65000", btc["usd"])
	}
}

func TestPrices_Get_Empty(t *testing.T) {
	r := setupPricesRouter(newMockRepository(), &mockPricer{})

	req := httptest.NewRequest(http.MethodGet, "/api/prices", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}
}

func TestPrices_Get_PricerError(t *testing.T) {
	repo := newMockRepository()
	repo.holdings["id-1"] = portfolio.Holding{
		ID: "id-1", CoinGeckoID: "bitcoin",
		Quantity: 1, AvgPurchasePrice: 40000,
		CreatedAt: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
		UpdatedAt: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
	}
	pricer := &mockPricer{err: errors.New("rate limited")}
	r := setupPricesRouter(repo, pricer)

	req := httptest.NewRequest(http.MethodGet, "/api/prices", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadGateway)
	}
}
