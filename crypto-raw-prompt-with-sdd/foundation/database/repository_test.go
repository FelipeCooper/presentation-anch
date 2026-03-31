package database

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/cooper/crypto-portfolio-tracker/domain/portfolio"
	"github.com/jackc/pgx/v5/pgxpool"
)

// testPool returns a pgxpool.Pool connected to the test database.
// It skips the test if TEST_DATABASE_URL is not set.
// It runs migrations and truncates the holdings table before returning.
func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()

	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set; skipping integration test")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := New(ctx, dbURL)
	if err != nil {
		t.Fatalf("connecting to test database: %v", err)
	}

	// Run migrations using pgx5 scheme required by golang-migrate
	migrateURL := toMigrateURL(dbURL)
	if err := Migrate(migrateURL); err != nil {
		pool.Close()
		t.Fatalf("running migrations: %v", err)
	}

	// Clean tables before each test
	if _, err := pool.Exec(ctx, "TRUNCATE holdings CASCADE"); err != nil {
		pool.Close()
		t.Fatalf("truncating holdings: %v", err)
	}

	t.Cleanup(func() {
		pool.Close()
	})

	return pool
}

// toMigrateURL converts a postgres:// URL to the pgx5:// scheme used by golang-migrate.
func toMigrateURL(dbURL string) string {
	if len(dbURL) > 11 && dbURL[:11] == "postgres://" {
		return "pgx5://" + dbURL[11:]
	}
	if len(dbURL) > 13 && dbURL[:13] == "postgresql://" {
		return "pgx5://" + dbURL[13:]
	}
	return dbURL
}

func TestRepository_Create(t *testing.T) {
	pool := testPool(t)
	repo := NewHoldingRepository(pool)
	ctx := context.Background()

	h := portfolio.Holding{
		CoinGeckoID:      "bitcoin",
		Symbol:           "btc",
		Name:             "Bitcoin",
		Quantity:         1.5,
		AvgPurchasePrice: 42000,
	}

	created, err := repo.Create(ctx, h)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if created.ID == "" {
		t.Error("expected generated UUID, got empty string")
	}
	if created.CoinGeckoID != "bitcoin" {
		t.Errorf("CoinGeckoID = %q, want %q", created.CoinGeckoID, "bitcoin")
	}
	if created.Symbol != "btc" {
		t.Errorf("Symbol = %q, want %q", created.Symbol, "btc")
	}
	if created.Name != "Bitcoin" {
		t.Errorf("Name = %q, want %q", created.Name, "Bitcoin")
	}
	if created.Quantity != 1.5 {
		t.Errorf("Quantity = %v, want 1.5", created.Quantity)
	}
	if created.AvgPurchasePrice != 42000 {
		t.Errorf("AvgPurchasePrice = %v, want 42000", created.AvgPurchasePrice)
	}
	if created.CreatedAt.IsZero() {
		t.Error("expected non-zero CreatedAt")
	}
	if created.UpdatedAt.IsZero() {
		t.Error("expected non-zero UpdatedAt")
	}
}

func TestRepository_CreateDuplicate(t *testing.T) {
	pool := testPool(t)
	repo := NewHoldingRepository(pool)
	ctx := context.Background()

	h := portfolio.Holding{
		CoinGeckoID:      "bitcoin",
		Symbol:           "btc",
		Name:             "Bitcoin",
		Quantity:         1,
		AvgPurchasePrice: 40000,
	}

	if _, err := repo.Create(ctx, h); err != nil {
		t.Fatalf("first create: %v", err)
	}

	_, err := repo.Create(ctx, h)
	if err == nil {
		t.Fatal("expected error for duplicate coingecko_id")
	}
	if err != portfolio.ErrDuplicateHolding {
		t.Errorf("err = %v, want %v", err, portfolio.ErrDuplicateHolding)
	}
}

func TestRepository_Get(t *testing.T) {
	pool := testPool(t)
	repo := NewHoldingRepository(pool)
	ctx := context.Background()

	created, err := repo.Create(ctx, portfolio.Holding{
		CoinGeckoID:      "ethereum",
		Symbol:           "eth",
		Name:             "Ethereum",
		Quantity:         10,
		AvgPurchasePrice: 3000,
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	got, err := repo.Get(ctx, created.ID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}

	if got.ID != created.ID {
		t.Errorf("ID = %q, want %q", got.ID, created.ID)
	}
	if got.CoinGeckoID != "ethereum" {
		t.Errorf("CoinGeckoID = %q, want %q", got.CoinGeckoID, "ethereum")
	}
}

func TestRepository_GetNotFound(t *testing.T) {
	pool := testPool(t)
	repo := NewHoldingRepository(pool)
	ctx := context.Background()

	_, err := repo.Get(ctx, "00000000-0000-0000-0000-000000000000")
	if err == nil {
		t.Fatal("expected error for not found")
	}
	if err != portfolio.ErrNotFound {
		t.Errorf("err = %v, want %v", err, portfolio.ErrNotFound)
	}
}

func TestRepository_List(t *testing.T) {
	pool := testPool(t)
	repo := NewHoldingRepository(pool)
	ctx := context.Background()

	// Empty list
	holdings, err := repo.List(ctx)
	if err != nil {
		t.Fatalf("list empty: %v", err)
	}
	if len(holdings) != 0 {
		t.Errorf("expected 0 holdings, got %d", len(holdings))
	}

	// Add two holdings
	if _, err := repo.Create(ctx, portfolio.Holding{
		CoinGeckoID: "bitcoin", Symbol: "btc", Name: "Bitcoin",
		Quantity: 1, AvgPurchasePrice: 40000,
	}); err != nil {
		t.Fatalf("create bitcoin: %v", err)
	}
	if _, err := repo.Create(ctx, portfolio.Holding{
		CoinGeckoID: "ethereum", Symbol: "eth", Name: "Ethereum",
		Quantity: 10, AvgPurchasePrice: 3000,
	}); err != nil {
		t.Fatalf("create ethereum: %v", err)
	}

	holdings, err = repo.List(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(holdings) != 2 {
		t.Errorf("expected 2 holdings, got %d", len(holdings))
	}
}

func TestRepository_Update(t *testing.T) {
	pool := testPool(t)
	repo := NewHoldingRepository(pool)
	ctx := context.Background()

	created, err := repo.Create(ctx, portfolio.Holding{
		CoinGeckoID: "bitcoin", Symbol: "btc", Name: "Bitcoin",
		Quantity: 1, AvgPurchasePrice: 40000,
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	updated, err := repo.Update(ctx, portfolio.Holding{
		ID:               created.ID,
		Quantity:         2.5,
		AvgPurchasePrice: 45000,
	})
	if err != nil {
		t.Fatalf("update: %v", err)
	}

	if updated.Quantity != 2.5 {
		t.Errorf("Quantity = %v, want 2.5", updated.Quantity)
	}
	if updated.AvgPurchasePrice != 45000 {
		t.Errorf("AvgPurchasePrice = %v, want 45000", updated.AvgPurchasePrice)
	}
	if !updated.UpdatedAt.After(created.UpdatedAt) {
		t.Error("expected UpdatedAt to be after original")
	}
	// Name and symbol should be preserved
	if updated.Name != "Bitcoin" {
		t.Errorf("Name = %q, want %q", updated.Name, "Bitcoin")
	}
}

func TestRepository_UpdateNotFound(t *testing.T) {
	pool := testPool(t)
	repo := NewHoldingRepository(pool)
	ctx := context.Background()

	_, err := repo.Update(ctx, portfolio.Holding{
		ID:               "00000000-0000-0000-0000-000000000000",
		Quantity:         1,
		AvgPurchasePrice: 100,
	})
	if err == nil {
		t.Fatal("expected error for not found")
	}
	if err != portfolio.ErrNotFound {
		t.Errorf("err = %v, want %v", err, portfolio.ErrNotFound)
	}
}

func TestRepository_Delete(t *testing.T) {
	pool := testPool(t)
	repo := NewHoldingRepository(pool)
	ctx := context.Background()

	created, err := repo.Create(ctx, portfolio.Holding{
		CoinGeckoID: "bitcoin", Symbol: "btc", Name: "Bitcoin",
		Quantity: 1, AvgPurchasePrice: 40000,
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	if err := repo.Delete(ctx, created.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}

	_, err = repo.Get(ctx, created.ID)
	if err != portfolio.ErrNotFound {
		t.Errorf("expected ErrNotFound after delete, got %v", err)
	}
}

func TestRepository_DeleteNotFound(t *testing.T) {
	pool := testPool(t)
	repo := NewHoldingRepository(pool)
	ctx := context.Background()

	err := repo.Delete(ctx, "00000000-0000-0000-0000-000000000000")
	if err == nil {
		t.Fatal("expected error for not found")
	}
	if err != portfolio.ErrNotFound {
		t.Errorf("err = %v, want %v", err, portfolio.ErrNotFound)
	}
}

func TestRepository_ExistsByCoinID(t *testing.T) {
	pool := testPool(t)
	repo := NewHoldingRepository(pool)
	ctx := context.Background()

	// Should not exist yet
	exists, err := repo.ExistsByCoinID(ctx, "bitcoin")
	if err != nil {
		t.Fatalf("exists check: %v", err)
	}
	if exists {
		t.Error("expected false before create")
	}

	// Create and check again
	if _, err := repo.Create(ctx, portfolio.Holding{
		CoinGeckoID: "bitcoin", Symbol: "btc", Name: "Bitcoin",
		Quantity: 1, AvgPurchasePrice: 40000,
	}); err != nil {
		t.Fatalf("create: %v", err)
	}

	exists, err = repo.ExistsByCoinID(ctx, "bitcoin")
	if err != nil {
		t.Fatalf("exists check: %v", err)
	}
	if !exists {
		t.Error("expected true after create")
	}

	// Non-existent coin
	exists, err = repo.ExistsByCoinID(ctx, "dogecoin")
	if err != nil {
		t.Fatalf("exists check: %v", err)
	}
	if exists {
		t.Error("expected false for non-existent coin")
	}
}
