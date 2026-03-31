package app

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/cooper/crypto-portfolio-tracker/app/handlers"
	"github.com/cooper/crypto-portfolio-tracker/domain/portfolio"
	"github.com/cooper/crypto-portfolio-tracker/foundation/coingecko"
	"github.com/cooper/crypto-portfolio-tracker/foundation/config"
	"github.com/cooper/crypto-portfolio-tracker/foundation/database"
	"github.com/cooper/crypto-portfolio-tracker/foundation/httpclient"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Dependencies holds all wired application dependencies.
type Dependencies struct {
	Pool    *pgxpool.Pool
	Pricer  *coingecko.Pricer
	Service *portfolio.Service
	Handler http.Handler
}

// Wire initializes all dependencies and returns a fully wired Dependencies struct.
func Wire(ctx context.Context, cfg config.Config, log *slog.Logger) (Dependencies, error) {
	// Foundation: database
	log.Info("connecting to database")
	pool, err := database.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return Dependencies{}, fmt.Errorf("connecting to database: %w", err)
	}

	// Foundation: run migrations
	log.Info("running database migrations")
	if err := database.Migrate(cfg.DatabaseURL); err != nil {
		pool.Close()
		return Dependencies{}, fmt.Errorf("running migrations: %w", err)
	}

	// Foundation: HTTP client for CoinGecko
	httpClient := httpclient.New(cfg.HTTPClientTimeout)

	// Foundation: CoinGecko pricer
	pricer := coingecko.NewPricer(httpClient, cfg.CoinGeckoBaseURL, cfg.CoinGeckoAPIKey)

	// Foundation: repository and coin store
	repo := database.NewHoldingRepository(pool)
	coinStore, err := database.NewCoinStore(ctx, pool)
	if err != nil {
		pool.Close()
		return Dependencies{}, fmt.Errorf("creating coin store: %w", err)
	}

	// Domain: service
	service := portfolio.NewService(repo, pricer, coinStore)

	// App: handlers
	portfolioHandler := handlers.NewPortfolio(service, log)
	pricesHandler := handlers.NewPrices(service, log)
	coinsHandler := handlers.NewCoins(service, log)

	// App: server
	handler := NewServer(pool, portfolioHandler, pricesHandler, coinsHandler, log)

	return Dependencies{
		Pool:    pool,
		Pricer:  pricer,
		Service: service,
		Handler: handler,
	}, nil
}
