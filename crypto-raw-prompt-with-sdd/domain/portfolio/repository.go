package portfolio

import "context"

// Repository defines persistence operations for holdings.
type Repository interface {
	List(ctx context.Context) ([]Holding, error)
	Get(ctx context.Context, id string) (Holding, error)
	Create(ctx context.Context, h Holding) (Holding, error)
	Update(ctx context.Context, h Holding) (Holding, error)
	Delete(ctx context.Context, id string) error
	ExistsByCoinID(ctx context.Context, coinGeckoID string) (bool, error)
}
