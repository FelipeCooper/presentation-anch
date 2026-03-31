package database

import (
	"context"
	"fmt"

	"github.com/cooper/crypto-portfolio-tracker/domain/portfolio"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// CoinStoreDB implements portfolio.CoinStore using PostgreSQL.
type CoinStoreDB struct {
	pool       *pgxpool.Pool
	hasTrigram bool
}

// NewCoinStore creates a CoinStoreDB backed by the given connection pool.
// It probes for the pg_trgm extension to decide between trigram similarity and ILIKE fallback.
func NewCoinStore(ctx context.Context, pool *pgxpool.Pool) (*CoinStoreDB, error) {
	cs := &CoinStoreDB{pool: pool}

	var exists bool
	err := pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm')`).Scan(&exists)
	if err != nil {
		return nil, fmt.Errorf("checking pg_trgm extension: %w", err)
	}
	cs.hasTrigram = exists

	return cs, nil
}

// Search finds coins matching the query by name or symbol, ordered by relevance.
// Uses trigram similarity when pg_trgm is available, otherwise falls back to ILIKE.
func (cs *CoinStoreDB) Search(ctx context.Context, query string, limit int) ([]portfolio.Coin, error) {
	if query == "" {
		return nil, nil
	}

	var sqlQuery string
	if cs.hasTrigram {
		sqlQuery = `
			SELECT coingecko_id, symbol, name
			FROM coins
			WHERE similarity(name, $1) > 0.1 OR symbol ILIKE $2
			ORDER BY similarity(name, $1) DESC, name ASC
			LIMIT $3
		`
	} else {
		sqlQuery = `
			SELECT coingecko_id, symbol, name
			FROM coins
			WHERE name ILIKE '%' || $1 || '%' OR symbol ILIKE $2
			ORDER BY name ASC
			LIMIT $3
		`
	}

	likePattern := query + "%"
	rows, err := cs.pool.Query(ctx, sqlQuery, query, likePattern, limit)
	if err != nil {
		return nil, fmt.Errorf("searching coins: %w", err)
	}
	defer rows.Close()

	var coins []portfolio.Coin
	for rows.Next() {
		var c portfolio.Coin
		if err := rows.Scan(&c.CoinGeckoID, &c.Symbol, &c.Name); err != nil {
			return nil, fmt.Errorf("scanning coin: %w", err)
		}
		coins = append(coins, c)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating coins: %w", err)
	}

	return coins, nil
}

// RefreshCoins upserts all coins into the database using a batched transaction.
// Existing coins are updated if their symbol or name has changed.
func (cs *CoinStoreDB) RefreshCoins(ctx context.Context, coins []portfolio.Coin) error {
	const batchSize = 1000

	tx, err := cs.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("beginning transaction: %w", err)
	}
	defer func() {
		// Rollback is a no-op if already committed
		_ = tx.Rollback(ctx) // intentionally discarding error on deferred rollback
	}()

	for i := 0; i < len(coins); i += batchSize {
		end := i + batchSize
		if end > len(coins) {
			end = len(coins)
		}
		batch := coins[i:end]

		if err := cs.upsertBatch(ctx, tx, batch); err != nil {
			return fmt.Errorf("upserting batch at offset %d: %w", i, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("committing transaction: %w", err)
	}
	return nil
}

// upsertBatch inserts a slice of coins using a single multi-row INSERT ... ON CONFLICT.
func (cs *CoinStoreDB) upsertBatch(ctx context.Context, tx pgx.Tx, coins []portfolio.Coin) error {
	if len(coins) == 0 {
		return nil
	}

	// Build a multi-row VALUES clause with parameterized placeholders
	query := "INSERT INTO coins (coingecko_id, symbol, name) VALUES "
	args := make([]interface{}, 0, len(coins)*3)
	for i, c := range coins {
		if i > 0 {
			query += ", "
		}
		base := i * 3
		query += fmt.Sprintf("($%d, $%d, $%d)", base+1, base+2, base+3)
		args = append(args, c.CoinGeckoID, c.Symbol, c.Name)
	}
	query += " ON CONFLICT (coingecko_id) DO UPDATE SET symbol = EXCLUDED.symbol, name = EXCLUDED.name"

	_, err := tx.Exec(ctx, query, args...)
	return err
}
