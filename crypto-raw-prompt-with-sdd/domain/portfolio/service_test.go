package portfolio

import (
	"context"
	"testing"
	"time"
)

// --- Mock implementations ---

type mockRepository struct {
	holdings     map[string]Holding
	existsResult bool
	existsErr    error
	createErr    error
	updateErr    error
	deleteErr    error
	listErr      error
}

func newMockRepository() *mockRepository {
	return &mockRepository{holdings: make(map[string]Holding)}
}

func (m *mockRepository) List(_ context.Context) ([]Holding, error) {
	if m.listErr != nil {
		return nil, m.listErr
	}
	result := make([]Holding, 0, len(m.holdings))
	for _, h := range m.holdings {
		result = append(result, h)
	}
	return result, nil
}

func (m *mockRepository) Get(_ context.Context, id string) (Holding, error) {
	h, ok := m.holdings[id]
	if !ok {
		return Holding{}, ErrNotFound
	}
	return h, nil
}

func (m *mockRepository) Create(_ context.Context, h Holding) (Holding, error) {
	if m.createErr != nil {
		return Holding{}, m.createErr
	}
	h.ID = "generated-id"
	h.CreatedAt = time.Now()
	h.UpdatedAt = time.Now()
	m.holdings[h.ID] = h
	return h, nil
}

func (m *mockRepository) Update(_ context.Context, h Holding) (Holding, error) {
	if m.updateErr != nil {
		return Holding{}, m.updateErr
	}
	existing, ok := m.holdings[h.ID]
	if !ok {
		return Holding{}, ErrNotFound
	}
	existing.Quantity = h.Quantity
	existing.AvgPurchasePrice = h.AvgPurchasePrice
	existing.UpdatedAt = time.Now()
	m.holdings[h.ID] = existing
	return existing, nil
}

func (m *mockRepository) Delete(_ context.Context, id string) error {
	if m.deleteErr != nil {
		return m.deleteErr
	}
	if _, ok := m.holdings[id]; !ok {
		return ErrNotFound
	}
	delete(m.holdings, id)
	return nil
}

func (m *mockRepository) ExistsByCoinID(_ context.Context, _ string) (bool, error) {
	return m.existsResult, m.existsErr
}

type mockPricer struct {
	prices map[string]PriceData
	err    error
}

func (m *mockPricer) GetPrices(_ context.Context, coinIDs []string) (map[string]PriceData, error) {
	if m.err != nil {
		return nil, m.err
	}
	result := make(map[string]PriceData)
	for _, id := range coinIDs {
		if p, ok := m.prices[id]; ok {
			result[id] = p
		}
	}
	return result, nil
}

type mockCoinStore struct {
	coins []Coin
	err   error
}

func (m *mockCoinStore) Search(_ context.Context, _ string, limit int) ([]Coin, error) {
	if m.err != nil {
		return nil, m.err
	}
	if limit >= len(m.coins) {
		return m.coins, nil
	}
	return m.coins[:limit], nil
}

func (m *mockCoinStore) RefreshCoins(_ context.Context, _ []Coin) error {
	return nil
}

// --- Entity tests ---

func TestHolding_CostBasis(t *testing.T) {
	h := Holding{Quantity: 2.5, AvgPurchasePrice: 40000}
	got := h.CostBasis()
	want := 100000.0
	if got != want {
		t.Errorf("CostBasis() = %v, want %v", got, want)
	}
}

func TestHolding_CurrentValue(t *testing.T) {
	h := Holding{Quantity: 2.5}
	got := h.CurrentValue(50000)
	want := 125000.0
	if got != want {
		t.Errorf("CurrentValue() = %v, want %v", got, want)
	}
}

func TestHolding_PnL(t *testing.T) {
	tests := []struct {
		name     string
		holding  Holding
		price    float64
		wantPnL  float64
	}{
		{
			name:    "positive gain",
			holding: Holding{Quantity: 2, AvgPurchasePrice: 30000},
			price:   50000,
			wantPnL: 40000,
		},
		{
			name:    "negative loss",
			holding: Holding{Quantity: 2, AvgPurchasePrice: 50000},
			price:   30000,
			wantPnL: -40000,
		},
		{
			name:    "break even",
			holding: Holding{Quantity: 2, AvgPurchasePrice: 40000},
			price:   40000,
			wantPnL: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.holding.PnL(tt.price)
			if got != tt.wantPnL {
				t.Errorf("PnL() = %v, want %v", got, tt.wantPnL)
			}
		})
	}
}

func TestHolding_PnLPercent(t *testing.T) {
	tests := []struct {
		name    string
		holding Holding
		price   float64
		want    float64
	}{
		{
			name:    "positive percent",
			holding: Holding{Quantity: 1, AvgPurchasePrice: 100},
			price:   150,
			want:    50,
		},
		{
			name:    "negative percent",
			holding: Holding{Quantity: 1, AvgPurchasePrice: 100},
			price:   80,
			want:    -20,
		},
		{
			name:    "zero cost basis returns zero",
			holding: Holding{Quantity: 0, AvgPurchasePrice: 0},
			price:   100,
			want:    0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.holding.PnLPercent(tt.price)
			if got != tt.want {
				t.Errorf("PnLPercent() = %v, want %v", got, tt.want)
			}
		})
	}
}

// --- Service tests ---

func newTestService(repo *mockRepository, pricer *mockPricer, coins *mockCoinStore) *Service {
	return NewService(repo, pricer, coins)
}

func TestService_Create_HappyPath(t *testing.T) {
	repo := newMockRepository()
	svc := newTestService(repo, &mockPricer{}, &mockCoinStore{})

	h := Holding{
		CoinGeckoID:      "bitcoin",
		Symbol:           "btc",
		Name:             "Bitcoin",
		Quantity:         1.5,
		AvgPurchasePrice: 42000,
	}

	created, err := svc.Create(context.Background(), h)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if created.ID == "" {
		t.Error("expected generated ID")
	}
	if created.CoinGeckoID != "bitcoin" {
		t.Errorf("CoinGeckoID = %q, want %q", created.CoinGeckoID, "bitcoin")
	}
}

func TestService_Create_DuplicateRejection(t *testing.T) {
	repo := newMockRepository()
	repo.existsResult = true
	svc := newTestService(repo, &mockPricer{}, &mockCoinStore{})

	h := Holding{
		CoinGeckoID:      "bitcoin",
		Quantity:         1,
		AvgPurchasePrice: 42000,
	}

	_, err := svc.Create(context.Background(), h)
	if err == nil {
		t.Fatal("expected error for duplicate holding")
	}
	if err != ErrDuplicateHolding {
		t.Errorf("err = %v, want %v", err, ErrDuplicateHolding)
	}
}

func TestService_Create_ZeroQuantity(t *testing.T) {
	repo := newMockRepository()
	svc := newTestService(repo, &mockPricer{}, &mockCoinStore{})

	h := Holding{CoinGeckoID: "bitcoin", Quantity: 0, AvgPurchasePrice: 42000}
	_, err := svc.Create(context.Background(), h)
	if err == nil {
		t.Fatal("expected error for zero quantity")
	}
	assertErrorIs(t, err, ErrInvalidInput)
}

func TestService_Create_NegativeQuantity(t *testing.T) {
	repo := newMockRepository()
	svc := newTestService(repo, &mockPricer{}, &mockCoinStore{})

	h := Holding{CoinGeckoID: "bitcoin", Quantity: -1, AvgPurchasePrice: 42000}
	_, err := svc.Create(context.Background(), h)
	if err == nil {
		t.Fatal("expected error for negative quantity")
	}
	assertErrorIs(t, err, ErrInvalidInput)
}

func TestService_Create_ZeroPrice(t *testing.T) {
	repo := newMockRepository()
	svc := newTestService(repo, &mockPricer{}, &mockCoinStore{})

	h := Holding{CoinGeckoID: "bitcoin", Quantity: 1, AvgPurchasePrice: 0}
	_, err := svc.Create(context.Background(), h)
	if err == nil {
		t.Fatal("expected error for zero price")
	}
	assertErrorIs(t, err, ErrInvalidInput)
}

func TestService_Create_NegativePrice(t *testing.T) {
	repo := newMockRepository()
	svc := newTestService(repo, &mockPricer{}, &mockCoinStore{})

	h := Holding{CoinGeckoID: "bitcoin", Quantity: 1, AvgPurchasePrice: -100}
	_, err := svc.Create(context.Background(), h)
	if err == nil {
		t.Fatal("expected error for negative price")
	}
	assertErrorIs(t, err, ErrInvalidInput)
}

func TestService_Update_HappyPath(t *testing.T) {
	repo := newMockRepository()
	repo.holdings["id-1"] = Holding{
		ID: "id-1", CoinGeckoID: "bitcoin", Quantity: 1, AvgPurchasePrice: 40000,
	}
	svc := newTestService(repo, &mockPricer{}, &mockCoinStore{})

	updated, err := svc.Update(context.Background(), Holding{
		ID: "id-1", Quantity: 2, AvgPurchasePrice: 45000,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Quantity != 2 {
		t.Errorf("Quantity = %v, want 2", updated.Quantity)
	}
	if updated.AvgPurchasePrice != 45000 {
		t.Errorf("AvgPurchasePrice = %v, want 45000", updated.AvgPurchasePrice)
	}
}

func TestService_Update_NotFound(t *testing.T) {
	repo := newMockRepository()
	svc := newTestService(repo, &mockPricer{}, &mockCoinStore{})

	_, err := svc.Update(context.Background(), Holding{
		ID: "nonexistent", Quantity: 1, AvgPurchasePrice: 100,
	})
	if err == nil {
		t.Fatal("expected error for not found")
	}
}

func TestService_Update_InvalidQuantity(t *testing.T) {
	repo := newMockRepository()
	svc := newTestService(repo, &mockPricer{}, &mockCoinStore{})

	_, err := svc.Update(context.Background(), Holding{
		ID: "id-1", Quantity: -5, AvgPurchasePrice: 100,
	})
	if err == nil {
		t.Fatal("expected error for invalid quantity")
	}
	assertErrorIs(t, err, ErrInvalidInput)
}

func TestService_Delete_HappyPath(t *testing.T) {
	repo := newMockRepository()
	repo.holdings["id-1"] = Holding{ID: "id-1", CoinGeckoID: "bitcoin"}
	svc := newTestService(repo, &mockPricer{}, &mockCoinStore{})

	err := svc.Delete(context.Background(), "id-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(repo.holdings) != 0 {
		t.Error("holding should be deleted")
	}
}

func TestService_Delete_NotFound(t *testing.T) {
	repo := newMockRepository()
	svc := newTestService(repo, &mockPricer{}, &mockCoinStore{})

	err := svc.Delete(context.Background(), "nonexistent")
	if err == nil {
		t.Fatal("expected error for not found")
	}
}

func TestService_List(t *testing.T) {
	repo := newMockRepository()
	repo.holdings["id-1"] = Holding{ID: "id-1", CoinGeckoID: "bitcoin"}
	repo.holdings["id-2"] = Holding{ID: "id-2", CoinGeckoID: "ethereum"}
	svc := newTestService(repo, &mockPricer{}, &mockCoinStore{})

	holdings, err := svc.List(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(holdings) != 2 {
		t.Errorf("len = %d, want 2", len(holdings))
	}
}

func TestService_GetPrices_WithHoldings(t *testing.T) {
	repo := newMockRepository()
	repo.holdings["id-1"] = Holding{ID: "id-1", CoinGeckoID: "bitcoin"}
	repo.holdings["id-2"] = Holding{ID: "id-2", CoinGeckoID: "ethereum"}

	pricer := &mockPricer{
		prices: map[string]PriceData{
			"bitcoin":  {USD: 65000, USD24hChange: 2.5, LastUpdatedAt: 1000},
			"ethereum": {USD: 3500, USD24hChange: -1.2, LastUpdatedAt: 1000},
		},
	}
	svc := newTestService(repo, pricer, &mockCoinStore{})

	prices, err := svc.GetPrices(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(prices) != 2 {
		t.Errorf("len = %d, want 2", len(prices))
	}
	if prices["bitcoin"].USD != 65000 {
		t.Errorf("bitcoin USD = %v, want 65000", prices["bitcoin"].USD)
	}
}

func TestService_GetPrices_EmptyHoldings(t *testing.T) {
	repo := newMockRepository()
	svc := newTestService(repo, &mockPricer{}, &mockCoinStore{})

	prices, err := svc.GetPrices(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(prices) != 0 {
		t.Errorf("expected empty prices map, got %d entries", len(prices))
	}
}

func TestService_SearchCoins(t *testing.T) {
	coins := &mockCoinStore{
		coins: []Coin{
			{CoinGeckoID: "bitcoin", Symbol: "btc", Name: "Bitcoin"},
			{CoinGeckoID: "bitcoin-cash", Symbol: "bch", Name: "Bitcoin Cash"},
		},
	}
	svc := newTestService(newMockRepository(), &mockPricer{}, coins)

	results, err := svc.SearchCoins(context.Background(), "bit", 20)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 2 {
		t.Errorf("len = %d, want 2", len(results))
	}
}

func TestService_SearchCoins_DefaultLimit(t *testing.T) {
	coins := &mockCoinStore{
		coins: []Coin{
			{CoinGeckoID: "bitcoin", Symbol: "btc", Name: "Bitcoin"},
		},
	}
	svc := newTestService(newMockRepository(), &mockPricer{}, coins)

	results, err := svc.SearchCoins(context.Background(), "bit", 0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 1 {
		t.Errorf("len = %d, want 1", len(results))
	}
}

// --- Helpers ---

func assertErrorIs(t *testing.T, err, target error) {
	t.Helper()
	if err == nil {
		t.Fatalf("expected error wrapping %v, got nil", target)
	}
	// Use string contains since errors.Is won't match fmt.Errorf wrapped sentinel errors
	// that use %w. Actually, fmt.Errorf with %w does work with errors.Is.
	if !isWrapping(err, target) {
		t.Errorf("err = %v, want wrapping %v", err, target)
	}
}

func isWrapping(err, target error) bool {
	for err != nil {
		if err == target {
			return true
		}
		unwrapped, ok := err.(interface{ Unwrap() error })
		if !ok {
			return false
		}
		err = unwrapped.Unwrap()
	}
	return false
}
