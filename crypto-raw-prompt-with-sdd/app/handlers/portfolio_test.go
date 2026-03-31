package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/cooper/crypto-portfolio-tracker/app/handlers"
	"github.com/cooper/crypto-portfolio-tracker/domain/portfolio"
	"github.com/go-chi/chi/v5"
)

// --- Mock implementations for handler tests ---

type mockRepository struct {
	holdings     map[string]portfolio.Holding
	existsResult bool
	listErr      error
	createErr    error
	updateErr    error
	deleteErr    error
}

func newMockRepository() *mockRepository {
	return &mockRepository{holdings: make(map[string]portfolio.Holding)}
}

func (m *mockRepository) List(_ context.Context) ([]portfolio.Holding, error) {
	if m.listErr != nil {
		return nil, m.listErr
	}
	result := make([]portfolio.Holding, 0, len(m.holdings))
	for _, h := range m.holdings {
		result = append(result, h)
	}
	return result, nil
}

func (m *mockRepository) Get(_ context.Context, id string) (portfolio.Holding, error) {
	h, ok := m.holdings[id]
	if !ok {
		return portfolio.Holding{}, portfolio.ErrNotFound
	}
	return h, nil
}

func (m *mockRepository) Create(_ context.Context, h portfolio.Holding) (portfolio.Holding, error) {
	if m.createErr != nil {
		return portfolio.Holding{}, m.createErr
	}
	h.ID = "test-id"
	h.CreatedAt = time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	h.UpdatedAt = time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	m.holdings[h.ID] = h
	return h, nil
}

func (m *mockRepository) Update(_ context.Context, h portfolio.Holding) (portfolio.Holding, error) {
	if m.updateErr != nil {
		return portfolio.Holding{}, m.updateErr
	}
	existing, ok := m.holdings[h.ID]
	if !ok {
		return portfolio.Holding{}, portfolio.ErrNotFound
	}
	existing.Quantity = h.Quantity
	existing.AvgPurchasePrice = h.AvgPurchasePrice
	existing.UpdatedAt = time.Date(2025, 1, 2, 0, 0, 0, 0, time.UTC)
	m.holdings[h.ID] = existing
	return existing, nil
}

func (m *mockRepository) Delete(_ context.Context, id string) error {
	if m.deleteErr != nil {
		return m.deleteErr
	}
	if _, ok := m.holdings[id]; !ok {
		return portfolio.ErrNotFound
	}
	delete(m.holdings, id)
	return nil
}

func (m *mockRepository) ExistsByCoinID(_ context.Context, _ string) (bool, error) {
	return m.existsResult, nil
}

type mockPricer struct {
	prices map[string]portfolio.PriceData
	err    error
}

func (m *mockPricer) GetPrices(_ context.Context, coinIDs []string) (map[string]portfolio.PriceData, error) {
	if m.err != nil {
		return nil, m.err
	}
	result := make(map[string]portfolio.PriceData)
	for _, id := range coinIDs {
		if p, ok := m.prices[id]; ok {
			result[id] = p
		}
	}
	return result, nil
}

type mockCoinStore struct {
	coins []portfolio.Coin
	err   error
}

func (m *mockCoinStore) Search(_ context.Context, _ string, limit int) ([]portfolio.Coin, error) {
	if m.err != nil {
		return nil, m.err
	}
	if limit >= len(m.coins) {
		return m.coins, nil
	}
	return m.coins[:limit], nil
}

func (m *mockCoinStore) RefreshCoins(_ context.Context, _ []portfolio.Coin) error {
	return nil
}

func newTestLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(&bytes.Buffer{}, nil))
}

func setupPortfolioRouter(repo *mockRepository) (*chi.Mux, *portfolio.Service) {
	svc := portfolio.NewService(repo, &mockPricer{}, &mockCoinStore{})
	log := newTestLogger()
	h := handlers.NewPortfolio(svc, log)

	r := chi.NewRouter()
	r.Get("/api/holdings", h.List)
	r.Post("/api/holdings", h.Create)
	r.Put("/api/holdings/{id}", h.Update)
	r.Delete("/api/holdings/{id}", h.Delete)
	return r, svc
}

func TestPortfolio_List_Empty(t *testing.T) {
	r, _ := setupPortfolioRouter(newMockRepository())

	req := httptest.NewRequest(http.MethodGet, "/api/holdings", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}

	var resp []map[string]interface{}
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if len(resp) != 0 {
		t.Errorf("expected empty list, got %d items", len(resp))
	}
}

func TestPortfolio_List_WithHoldings(t *testing.T) {
	repo := newMockRepository()
	repo.holdings["id-1"] = portfolio.Holding{
		ID: "id-1", CoinGeckoID: "bitcoin", Symbol: "btc", Name: "Bitcoin",
		Quantity: 1, AvgPurchasePrice: 40000,
		CreatedAt: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
		UpdatedAt: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
	}
	r, _ := setupPortfolioRouter(repo)

	req := httptest.NewRequest(http.MethodGet, "/api/holdings", nil)
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
		t.Fatalf("expected 1 holding, got %d", len(resp))
	}
	if resp[0]["coingeckoId"] != "bitcoin" {
		t.Errorf("coingeckoId = %v, want bitcoin", resp[0]["coingeckoId"])
	}
}

func TestPortfolio_Create_HappyPath(t *testing.T) {
	r, _ := setupPortfolioRouter(newMockRepository())

	body := `{"coingeckoId":"bitcoin","symbol":"btc","name":"Bitcoin","quantity":1.5,"avgPurchasePrice":42000}`
	req := httptest.NewRequest(http.MethodPost, "/api/holdings", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("status = %d, want %d. Body: %s", w.Code, http.StatusCreated, w.Body.String())
	}

	var resp map[string]interface{}
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if resp["id"] != "test-id" {
		t.Errorf("id = %v, want test-id", resp["id"])
	}
	if resp["coingeckoId"] != "bitcoin" {
		t.Errorf("coingeckoId = %v, want bitcoin", resp["coingeckoId"])
	}
}

func TestPortfolio_Create_InvalidJSON(t *testing.T) {
	r, _ := setupPortfolioRouter(newMockRepository())

	req := httptest.NewRequest(http.MethodPost, "/api/holdings", bytes.NewBufferString("{invalid"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestPortfolio_Create_InvalidQuantity(t *testing.T) {
	r, _ := setupPortfolioRouter(newMockRepository())

	body := `{"coingeckoId":"bitcoin","symbol":"btc","name":"Bitcoin","quantity":0,"avgPurchasePrice":42000}`
	req := httptest.NewRequest(http.MethodPost, "/api/holdings", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestPortfolio_Create_Duplicate(t *testing.T) {
	repo := newMockRepository()
	repo.existsResult = true
	r, _ := setupPortfolioRouter(repo)

	body := `{"coingeckoId":"bitcoin","symbol":"btc","name":"Bitcoin","quantity":1,"avgPurchasePrice":42000}`
	req := httptest.NewRequest(http.MethodPost, "/api/holdings", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusConflict)
	}
}

func TestPortfolio_Update_HappyPath(t *testing.T) {
	repo := newMockRepository()
	repo.holdings["id-1"] = portfolio.Holding{
		ID: "id-1", CoinGeckoID: "bitcoin", Symbol: "btc", Name: "Bitcoin",
		Quantity: 1, AvgPurchasePrice: 40000,
		CreatedAt: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
		UpdatedAt: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
	}
	r, _ := setupPortfolioRouter(repo)

	body := `{"quantity":2,"avgPurchasePrice":45000}`
	req := httptest.NewRequest(http.MethodPut, "/api/holdings/id-1", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d. Body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp map[string]interface{}
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if resp["quantity"] != 2.0 {
		t.Errorf("quantity = %v, want 2", resp["quantity"])
	}
}

func TestPortfolio_Update_NotFound(t *testing.T) {
	r, _ := setupPortfolioRouter(newMockRepository())

	body := `{"quantity":2,"avgPurchasePrice":45000}`
	req := httptest.NewRequest(http.MethodPut, "/api/holdings/nonexistent", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusNotFound)
	}
}

func TestPortfolio_Delete_HappyPath(t *testing.T) {
	repo := newMockRepository()
	repo.holdings["id-1"] = portfolio.Holding{ID: "id-1", CoinGeckoID: "bitcoin"}
	r, _ := setupPortfolioRouter(repo)

	req := httptest.NewRequest(http.MethodDelete, "/api/holdings/id-1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusNoContent)
	}
}

func TestPortfolio_Delete_NotFound(t *testing.T) {
	r, _ := setupPortfolioRouter(newMockRepository())

	req := httptest.NewRequest(http.MethodDelete, "/api/holdings/nonexistent", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusNotFound)
	}
}
