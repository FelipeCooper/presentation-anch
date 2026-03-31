package database

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/cooper/crypto-portfolio-tracker/domain/portfolio"
	"github.com/jackc/pgx/v5/pgxpool"
)

// testPoolForCoins returns a pool and truncates the coins table.
func testPoolForCoins(t *testing.T) *pgxpool.Pool {
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

	migrateURL := toMigrateURL(dbURL)
	if err := Migrate(migrateURL); err != nil {
		pool.Close()
		t.Fatalf("running migrations: %v", err)
	}

	if _, err := pool.Exec(ctx, "TRUNCATE coins CASCADE"); err != nil {
		pool.Close()
		t.Fatalf("truncating coins: %v", err)
	}

	t.Cleanup(func() {
		pool.Close()
	})

	return pool
}

func TestCoinStore_RefreshCoins(t *testing.T) {
	pool := testPoolForCoins(t)
	ctx := context.Background()

	cs, err := NewCoinStore(ctx, pool)
	if err != nil {
		t.Fatalf("creating coin store: %v", err)
	}

	coins := []portfolio.Coin{
		{CoinGeckoID: "bitcoin", Symbol: "btc", Name: "Bitcoin"},
		{CoinGeckoID: "ethereum", Symbol: "eth", Name: "Ethereum"},
		{CoinGeckoID: "cardano", Symbol: "ada", Name: "Cardano"},
	}

	if err := cs.RefreshCoins(ctx, coins); err != nil {
		t.Fatalf("refresh coins: %v", err)
	}

	// Verify coins were inserted
	var count int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM coins").Scan(&count); err != nil {
		t.Fatalf("counting coins: %v", err)
	}
	if count != 3 {
		t.Errorf("count = %d, want 3", count)
	}

	// Upsert with updated name
	updatedCoins := []portfolio.Coin{
		{CoinGeckoID: "bitcoin", Symbol: "btc", Name: "Bitcoin (Updated)"},
		{CoinGeckoID: "solana", Symbol: "sol", Name: "Solana"},
	}

	if err := cs.RefreshCoins(ctx, updatedCoins); err != nil {
		t.Fatalf("refresh coins (upsert): %v", err)
	}

	// Total should be 4 (3 original + 1 new)
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM coins").Scan(&count); err != nil {
		t.Fatalf("counting coins: %v", err)
	}
	if count != 4 {
		t.Errorf("count = %d, want 4", count)
	}

	// Verify bitcoin was updated
	var name string
	if err := pool.QueryRow(ctx, "SELECT name FROM coins WHERE coingecko_id = 'bitcoin'").Scan(&name); err != nil {
		t.Fatalf("getting bitcoin name: %v", err)
	}
	if name != "Bitcoin (Updated)" {
		t.Errorf("name = %q, want %q", name, "Bitcoin (Updated)")
	}
}

func TestCoinStore_RefreshCoins_Empty(t *testing.T) {
	pool := testPoolForCoins(t)
	ctx := context.Background()

	cs, err := NewCoinStore(ctx, pool)
	if err != nil {
		t.Fatalf("creating coin store: %v", err)
	}

	// Should not error on empty slice
	if err := cs.RefreshCoins(ctx, nil); err != nil {
		t.Fatalf("refresh empty coins: %v", err)
	}
}

func TestCoinStore_SearchByName(t *testing.T) {
	pool := testPoolForCoins(t)
	ctx := context.Background()

	cs, err := NewCoinStore(ctx, pool)
	if err != nil {
		t.Fatalf("creating coin store: %v", err)
	}

	coins := []portfolio.Coin{
		{CoinGeckoID: "bitcoin", Symbol: "btc", Name: "Bitcoin"},
		{CoinGeckoID: "bitcoin-cash", Symbol: "bch", Name: "Bitcoin Cash"},
		{CoinGeckoID: "ethereum", Symbol: "eth", Name: "Ethereum"},
		{CoinGeckoID: "cardano", Symbol: "ada", Name: "Cardano"},
	}
	if err := cs.RefreshCoins(ctx, coins); err != nil {
		t.Fatalf("refresh coins: %v", err)
	}

	results, err := cs.Search(ctx, "Bitcoin", 20)
	if err != nil {
		t.Fatalf("search: %v", err)
	}

	if len(results) < 2 {
		t.Fatalf("expected at least 2 results for 'Bitcoin', got %d", len(results))
	}

	// Both Bitcoin entries should be present
	found := make(map[string]bool)
	for _, c := range results {
		found[c.CoinGeckoID] = true
	}
	if !found["bitcoin"] {
		t.Error("expected 'bitcoin' in results")
	}
	if !found["bitcoin-cash"] {
		t.Error("expected 'bitcoin-cash' in results")
	}
}

func TestCoinStore_SearchBySymbol(t *testing.T) {
	pool := testPoolForCoins(t)
	ctx := context.Background()

	cs, err := NewCoinStore(ctx, pool)
	if err != nil {
		t.Fatalf("creating coin store: %v", err)
	}

	coins := []portfolio.Coin{
		{CoinGeckoID: "bitcoin", Symbol: "btc", Name: "Bitcoin"},
		{CoinGeckoID: "ethereum", Symbol: "eth", Name: "Ethereum"},
	}
	if err := cs.RefreshCoins(ctx, coins); err != nil {
		t.Fatalf("refresh coins: %v", err)
	}

	results, err := cs.Search(ctx, "eth", 20)
	if err != nil {
		t.Fatalf("search: %v", err)
	}

	if len(results) == 0 {
		t.Fatal("expected at least 1 result for symbol 'eth'")
	}

	found := false
	for _, c := range results {
		if c.CoinGeckoID == "ethereum" {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected 'ethereum' in results")
	}
}

func TestCoinStore_SearchLimit(t *testing.T) {
	pool := testPoolForCoins(t)
	ctx := context.Background()

	cs, err := NewCoinStore(ctx, pool)
	if err != nil {
		t.Fatalf("creating coin store: %v", err)
	}

	// Insert many coins with similar names
	coins := make([]portfolio.Coin, 25)
	for i := range coins {
		coins[i] = portfolio.Coin{
			CoinGeckoID: fmt.Sprintf("test-coin-%d", i),
			Symbol:      fmt.Sprintf("tc%d", i),
			Name:        fmt.Sprintf("TestCoin %d", i),
		}
	}
	if err := cs.RefreshCoins(ctx, coins); err != nil {
		t.Fatalf("refresh coins: %v", err)
	}

	results, err := cs.Search(ctx, "TestCoin", 5)
	if err != nil {
		t.Fatalf("search: %v", err)
	}

	if len(results) > 5 {
		t.Errorf("expected at most 5 results, got %d", len(results))
	}
}

func TestCoinStore_SearchEmptyQuery(t *testing.T) {
	pool := testPoolForCoins(t)
	ctx := context.Background()

	cs, err := NewCoinStore(ctx, pool)
	if err != nil {
		t.Fatalf("creating coin store: %v", err)
	}

	results, err := cs.Search(ctx, "", 20)
	if err != nil {
		t.Fatalf("search: %v", err)
	}
	if len(results) != 0 {
		t.Errorf("expected 0 results for empty query, got %d", len(results))
	}
}
