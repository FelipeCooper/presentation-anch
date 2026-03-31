package portfolio

import (
	"context"
	"errors"
	"fmt"
)

var (
	ErrDuplicateHolding = errors.New("holding already exists for this coin")
	ErrNotFound         = errors.New("holding not found")
	ErrInvalidInput     = errors.New("invalid input")
)

// Service implements portfolio use cases using domain interfaces.
type Service struct {
	repo   Repository
	pricer AssetPricer
	coins  CoinStore
}

// NewService creates a Service with the given dependencies.
func NewService(repo Repository, pricer AssetPricer, coins CoinStore) *Service {
	return &Service{
		repo:   repo,
		pricer: pricer,
		coins:  coins,
	}
}

// List returns all holdings.
func (s *Service) List(ctx context.Context) ([]Holding, error) {
	return s.repo.List(ctx)
}

// Create adds a new holding after validating inputs and checking for duplicates.
func (s *Service) Create(ctx context.Context, h Holding) (Holding, error) {
	if err := validateHolding(h); err != nil {
		return Holding{}, err
	}

	exists, err := s.repo.ExistsByCoinID(ctx, h.CoinGeckoID)
	if err != nil {
		return Holding{}, fmt.Errorf("checking duplicate: %w", err)
	}
	if exists {
		return Holding{}, ErrDuplicateHolding
	}

	created, err := s.repo.Create(ctx, h)
	if err != nil {
		return Holding{}, fmt.Errorf("creating holding: %w", err)
	}
	return created, nil
}

// Update modifies an existing holding's quantity and average purchase price.
func (s *Service) Update(ctx context.Context, h Holding) (Holding, error) {
	if err := validateHolding(h); err != nil {
		return Holding{}, err
	}

	updated, err := s.repo.Update(ctx, h)
	if err != nil {
		return Holding{}, fmt.Errorf("updating holding: %w", err)
	}
	return updated, nil
}

// Delete removes a holding by ID.
func (s *Service) Delete(ctx context.Context, id string) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return fmt.Errorf("deleting holding: %w", err)
	}
	return nil
}

// GetPrices fetches current prices for all held assets.
func (s *Service) GetPrices(ctx context.Context) (map[string]PriceData, error) {
	holdings, err := s.repo.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("listing holdings for prices: %w", err)
	}

	if len(holdings) == 0 {
		return map[string]PriceData{}, nil
	}

	coinIDs := make([]string, len(holdings))
	for i, h := range holdings {
		coinIDs[i] = h.CoinGeckoID
	}

	prices, err := s.pricer.GetPrices(ctx, coinIDs)
	if err != nil {
		return nil, fmt.Errorf("fetching prices: %w", err)
	}
	return prices, nil
}

// SearchCoins searches for available coins by name or symbol.
func (s *Service) SearchCoins(ctx context.Context, query string, limit int) ([]Coin, error) {
	if limit <= 0 {
		limit = 20
	}
	return s.coins.Search(ctx, query, limit)
}

// CoinStore returns the coin store dependency for use in background tasks.
func (s *Service) CoinStore() CoinStore {
	return s.coins
}

func validateHolding(h Holding) error {
	if h.Quantity <= 0 {
		return fmt.Errorf("%w: quantity must be positive", ErrInvalidInput)
	}
	if h.AvgPurchasePrice <= 0 {
		return fmt.Errorf("%w: average purchase price must be positive", ErrInvalidInput)
	}
	return nil
}
