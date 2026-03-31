package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/cooper/crypto-portfolio-tracker/app"
	"github.com/cooper/crypto-portfolio-tracker/foundation/config"
	"github.com/cooper/crypto-portfolio-tracker/foundation/logger"
)

func main() {
	log := logger.New(slog.LevelInfo)

	if err := run(log); err != nil {
		log.Error("application error", "error", err)
		os.Exit(1)
	}
}

func run(log *slog.Logger) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	deps, err := app.Wire(ctx, cfg, log)
	if err != nil {
		return err
	}
	defer deps.Pool.Close()

	// Background coin list refresh
	go refreshCoinsPeriodically(ctx, deps, log)

	srv := &http.Server{
		Addr:         ":" + cfg.ServerPort,
		Handler:      deps.Handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, syscall.SIGINT, syscall.SIGTERM)

	serverErr := make(chan error, 1)
	go func() {
		log.Info("server starting", "port", cfg.ServerPort)
		serverErr <- srv.ListenAndServe()
	}()

	select {
	case err := <-serverErr:
		return err
	case sig := <-shutdown:
		log.Info("shutdown signal received", "signal", sig)

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer shutdownCancel()

		if err := srv.Shutdown(shutdownCtx); err != nil {
			log.Error("graceful shutdown failed, forcing", "error", err)
			return srv.Close()
		}
	}

	return nil
}

func refreshCoinsPeriodically(ctx context.Context, deps app.Dependencies, log *slog.Logger) {
	// Initial refresh on startup
	refreshCoins(ctx, deps, log)

	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			refreshCoins(ctx, deps, log)
		}
	}
}

func refreshCoins(ctx context.Context, deps app.Dependencies, log *slog.Logger) {
	log.Info("refreshing coin list from CoinGecko")

	coins, err := deps.Pricer.FetchCoinList(ctx)
	if err != nil {
		log.Error("failed to fetch coin list", "error", err)
		return
	}

	coinStore := deps.Service.CoinStore()
	if err := coinStore.RefreshCoins(ctx, coins); err != nil {
		log.Error("failed to refresh coin store", "error", err)
		return
	}

	log.Info("coin list refreshed", "count", len(coins))
}
