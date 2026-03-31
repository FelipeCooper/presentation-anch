package database

import (
	"context"
	"errors"
	"fmt"

	"github.com/cooper/crypto-portfolio-tracker/domain/portfolio"
	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// HoldingRepository implements portfolio.Repository using PostgreSQL.
type HoldingRepository struct {
	pool *pgxpool.Pool
}

// NewHoldingRepository creates a HoldingRepository backed by the given connection pool.
func NewHoldingRepository(pool *pgxpool.Pool) *HoldingRepository {
	return &HoldingRepository{pool: pool}
}

// List returns all holdings ordered by creation time.
func (r *HoldingRepository) List(ctx context.Context) ([]portfolio.Holding, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, coingecko_id, symbol, name, quantity, avg_purchase_price, created_at, updated_at
		FROM holdings
		ORDER BY created_at ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("querying holdings: %w", err)
	}
	defer rows.Close()

	var holdings []portfolio.Holding
	for rows.Next() {
		h, err := scanHolding(rows)
		if err != nil {
			return nil, fmt.Errorf("scanning holding: %w", err)
		}
		holdings = append(holdings, h)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating holdings: %w", err)
	}

	return holdings, nil
}

// Get retrieves a single holding by ID. Returns portfolio.ErrNotFound if it does not exist.
func (r *HoldingRepository) Get(ctx context.Context, id string) (portfolio.Holding, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, coingecko_id, symbol, name, quantity, avg_purchase_price, created_at, updated_at
		FROM holdings
		WHERE id = $1
	`, id)

	h, err := scanHoldingRow(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return portfolio.Holding{}, portfolio.ErrNotFound
		}
		return portfolio.Holding{}, fmt.Errorf("getting holding %s: %w", id, err)
	}
	return h, nil
}

// Create inserts a new holding and returns it with the generated ID and timestamps.
// Returns portfolio.ErrDuplicateHolding if a holding with the same coingecko_id already exists.
func (r *HoldingRepository) Create(ctx context.Context, h portfolio.Holding) (portfolio.Holding, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO holdings (coingecko_id, symbol, name, quantity, avg_purchase_price)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, coingecko_id, symbol, name, quantity, avg_purchase_price, created_at, updated_at
	`, h.CoinGeckoID, h.Symbol, h.Name, h.Quantity, h.AvgPurchasePrice)

	created, err := scanHoldingRow(row)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == pgerrcode.UniqueViolation {
			return portfolio.Holding{}, portfolio.ErrDuplicateHolding
		}
		return portfolio.Holding{}, fmt.Errorf("creating holding: %w", err)
	}
	return created, nil
}

// Update modifies the quantity and average purchase price of an existing holding.
// Returns portfolio.ErrNotFound if the holding does not exist.
func (r *HoldingRepository) Update(ctx context.Context, h portfolio.Holding) (portfolio.Holding, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE holdings
		SET quantity = $2, avg_purchase_price = $3, updated_at = now()
		WHERE id = $1
		RETURNING id, coingecko_id, symbol, name, quantity, avg_purchase_price, created_at, updated_at
	`, h.ID, h.Quantity, h.AvgPurchasePrice)

	updated, err := scanHoldingRow(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return portfolio.Holding{}, portfolio.ErrNotFound
		}
		return portfolio.Holding{}, fmt.Errorf("updating holding %s: %w", h.ID, err)
	}
	return updated, nil
}

// Delete removes a holding by ID. Returns portfolio.ErrNotFound if it does not exist.
func (r *HoldingRepository) Delete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM holdings WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("deleting holding %s: %w", id, err)
	}
	if tag.RowsAffected() == 0 {
		return portfolio.ErrNotFound
	}
	return nil
}

// ExistsByCoinID checks whether a holding with the given CoinGecko ID exists.
func (r *HoldingRepository) ExistsByCoinID(ctx context.Context, coinGeckoID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM holdings WHERE coingecko_id = $1)`, coinGeckoID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("checking existence for coin %s: %w", coinGeckoID, err)
	}
	return exists, nil
}

// scanHolding scans a holding from a pgx.Rows iterator.
func scanHolding(rows pgx.Rows) (portfolio.Holding, error) {
	var h portfolio.Holding
	err := rows.Scan(&h.ID, &h.CoinGeckoID, &h.Symbol, &h.Name, &h.Quantity, &h.AvgPurchasePrice, &h.CreatedAt, &h.UpdatedAt)
	return h, err
}

// scanHoldingRow scans a holding from a single pgx.Row.
func scanHoldingRow(row pgx.Row) (portfolio.Holding, error) {
	var h portfolio.Holding
	err := row.Scan(&h.ID, &h.CoinGeckoID, &h.Symbol, &h.Name, &h.Quantity, &h.AvgPurchasePrice, &h.CreatedAt, &h.UpdatedAt)
	return h, err
}
