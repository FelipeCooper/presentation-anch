// Package app provides the HTTP server setup and application wiring.
package app

import (
	"log/slog"
	"net/http"

	"github.com/cooper/crypto-portfolio-tracker/app/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
)

// NewServer creates a configured chi router with all routes and middleware.
func NewServer(pool *pgxpool.Pool, portfolioHandler *handlers.Portfolio, pricesHandler *handlers.Prices, coinsHandler *handlers.Coins, log *slog.Logger) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/healthz", healthCheck(pool))

	r.Route("/api", func(r chi.Router) {
		r.Get("/holdings", portfolioHandler.List)
		r.Post("/holdings", portfolioHandler.Create)
		r.Put("/holdings/{id}", portfolioHandler.Update)
		r.Delete("/holdings/{id}", portfolioHandler.Delete)

		r.Get("/prices", pricesHandler.Get)

		r.Get("/coins", coinsHandler.Search)
	})

	return r
}

func healthCheck(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := pool.Ping(r.Context()); err != nil {
			handlers.WriteHealthError(w, http.StatusServiceUnavailable, "database unavailable")
			return
		}
		handlers.WriteHealthOK(w)
	}
}
