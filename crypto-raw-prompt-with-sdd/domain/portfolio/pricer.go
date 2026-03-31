package portfolio

import "context"

// PriceData holds pricing information for a single asset.
type PriceData struct {
	USD           float64
	USD24hChange  float64
	LastUpdatedAt int64
}

// AssetPricer fetches current prices for a set of assets.
type AssetPricer interface {
	GetPrices(ctx context.Context, coinIDs []string) (map[string]PriceData, error)
}
