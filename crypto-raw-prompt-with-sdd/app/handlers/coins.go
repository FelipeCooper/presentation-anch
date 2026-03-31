package handlers

import (
	"log/slog"
	"net/http"
	"strconv"

	"github.com/cooper/crypto-portfolio-tracker/domain/portfolio"
)

// Coins handles HTTP requests for coin search.
type Coins struct {
	service *portfolio.Service
	log     *slog.Logger
}

// NewCoins creates a Coins handler with the given service and logger.
func NewCoins(service *portfolio.Service, log *slog.Logger) *Coins {
	return &Coins{
		service: service,
		log:     log,
	}
}

// Search handles GET /api/coins?q={query} — searches coins by name/symbol.
func (c *Coins) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		writeError(w, http.StatusBadRequest, "query parameter 'q' is required")
		return
	}

	limit := 20
	if v := r.URL.Query().Get("limit"); v != "" {
		parsed, err := strconv.Atoi(v)
		if err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	coins, err := c.service.SearchCoins(r.Context(), query, limit)
	if err != nil {
		c.log.Error("searching coins", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to search coins")
		return
	}

	type coinResponse struct {
		CoinGeckoID string `json:"coingeckoId"`
		Symbol      string `json:"symbol"`
		Name        string `json:"name"`
	}

	resp := make([]coinResponse, len(coins))
	for i, coin := range coins {
		resp[i] = coinResponse{
			CoinGeckoID: coin.CoinGeckoID,
			Symbol:      coin.Symbol,
			Name:        coin.Name,
		}
	}

	writeJSON(w, http.StatusOK, resp)
}
