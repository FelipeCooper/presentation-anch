package portfolio

import "time"

// Holding represents a user's crypto holding with cost basis information.
type Holding struct {
	ID               string
	CoinGeckoID      string
	Symbol           string
	Name             string
	Quantity         float64
	AvgPurchasePrice float64
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

// CostBasis returns the total cost basis for this holding.
func (h Holding) CostBasis() float64 {
	return h.Quantity * h.AvgPurchasePrice
}

// CurrentValue returns the current market value given the current price per unit.
func (h Holding) CurrentValue(price float64) float64 {
	return h.Quantity * price
}

// PnL returns the absolute profit or loss in USD.
func (h Holding) PnL(price float64) float64 {
	return h.CurrentValue(price) - h.CostBasis()
}

// PnLPercent returns the percentage profit or loss. Returns 0 if cost basis is zero.
func (h Holding) PnLPercent(price float64) float64 {
	cb := h.CostBasis()
	if cb == 0 {
		return 0
	}
	return (h.PnL(price) / cb) * 100
}

// Coin represents a cryptocurrency available on CoinGecko.
type Coin struct {
	CoinGeckoID string
	Symbol      string
	Name        string
}
