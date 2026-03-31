package handlers

import (
	"log/slog"
	"net/http"

	"github.com/cooper/crypto-portfolio-tracker/domain/portfolio"
)

// Prices handles HTTP requests for live price data.
type Prices struct {
	service *portfolio.Service
	log     *slog.Logger
}

// NewPrices creates a Prices handler with the given service and logger.
func NewPrices(service *portfolio.Service, log *slog.Logger) *Prices {
	return &Prices{
		service: service,
		log:     log,
	}
}

// Get handles GET /api/prices — returns live prices for all held assets.
func (p *Prices) Get(w http.ResponseWriter, r *http.Request) {
	prices, err := p.service.GetPrices(r.Context())
	if err != nil {
		p.log.Error("fetching prices", "error", err)
		writeError(w, http.StatusBadGateway, "failed to fetch prices")
		return
	}

	type priceDataResponse struct {
		USD           float64 `json:"usd"`
		USD24hChange  float64 `json:"usd24hChange"`
		LastUpdatedAt int64   `json:"lastUpdatedAt"`
	}

	resp := make(map[string]priceDataResponse, len(prices))
	for coinID, pd := range prices {
		resp[coinID] = priceDataResponse{
			USD:           pd.USD,
			USD24hChange:  pd.USD24hChange,
			LastUpdatedAt: pd.LastUpdatedAt,
		}
	}

	writeJSON(w, http.StatusOK, resp)
}
