package handlers_test

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cooper/crypto-portfolio-tracker/app/handlers"
	"github.com/cooper/crypto-portfolio-tracker/domain/portfolio"
	"github.com/go-chi/chi/v5"
)

func setupCoinsRouter(coins *mockCoinStore) *chi.Mux {
	svc := portfolio.NewService(newMockRepository(), &mockPricer{}, coins)
	log := newTestLogger()
	h := handlers.NewCoins(svc, log)

	r := chi.NewRouter()
	r.Get("/api/coins", h.Search)
	return r
}

func TestCoins_Search_HappyPath(t *testing.T) {
	coins := &mockCoinStore{
		coins: []portfolio.Coin{
			{CoinGeckoID: "bitcoin", Symbol: "btc", Name: "Bitcoin"},
			{CoinGeckoID: "bitcoin-cash", Symbol: "bch", Name: "Bitcoin Cash"},
		},
	}
	r := setupCoinsRouter(coins)

	req := httptest.NewRequest(http.MethodGet, "/api/coins?q=bit", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}

	var resp []map[string]interface{}
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if len(resp) != 2 {
		t.Fatalf("expected 2 coins, got %d", len(resp))
	}
	if resp[0]["coingeckoId"] != "bitcoin" {
		t.Errorf("coingeckoId = %v, want bitcoin", resp[0]["coingeckoId"])
	}
}

func TestCoins_Search_MissingQuery(t *testing.T) {
	r := setupCoinsRouter(&mockCoinStore{})

	req := httptest.NewRequest(http.MethodGet, "/api/coins", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestCoins_Search_Error(t *testing.T) {
	coins := &mockCoinStore{err: errors.New("db error")}
	r := setupCoinsRouter(coins)

	req := httptest.NewRequest(http.MethodGet, "/api/coins?q=bit", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusInternalServerError)
	}
}

func TestCoins_Search_WithLimit(t *testing.T) {
	coins := &mockCoinStore{
		coins: []portfolio.Coin{
			{CoinGeckoID: "bitcoin", Symbol: "btc", Name: "Bitcoin"},
			{CoinGeckoID: "bitcoin-cash", Symbol: "bch", Name: "Bitcoin Cash"},
		},
	}
	r := setupCoinsRouter(coins)

	req := httptest.NewRequest(http.MethodGet, "/api/coins?q=bit&limit=1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}

	var resp []map[string]interface{}
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if len(resp) != 1 {
		t.Fatalf("expected 1 coin with limit=1, got %d", len(resp))
	}
}
