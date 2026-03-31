package portfolio

import "context"

// CoinStore provides access to the cached list of available coins.
type CoinStore interface {
	Search(ctx context.Context, query string, limit int) ([]Coin, error)
	RefreshCoins(ctx context.Context, coins []Coin) error
}
