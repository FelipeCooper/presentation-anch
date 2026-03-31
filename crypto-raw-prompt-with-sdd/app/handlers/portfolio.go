// Package handlers provides HTTP handlers for the crypto portfolio tracker API.
package handlers

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/cooper/crypto-portfolio-tracker/domain/portfolio"
	"github.com/go-chi/chi/v5"
)

// Portfolio handles HTTP requests for holdings CRUD operations.
type Portfolio struct {
	service *portfolio.Service
	log     *slog.Logger
}

// NewPortfolio creates a Portfolio handler with the given service and logger.
func NewPortfolio(service *portfolio.Service, log *slog.Logger) *Portfolio {
	return &Portfolio{
		service: service,
		log:     log,
	}
}

type createHoldingRequest struct {
	CoinGeckoID      string  `json:"coingeckoId"`
	Symbol           string  `json:"symbol"`
	Name             string  `json:"name"`
	Quantity         float64 `json:"quantity"`
	AvgPurchasePrice float64 `json:"avgPurchasePrice"`
}

type updateHoldingRequest struct {
	Quantity         float64 `json:"quantity"`
	AvgPurchasePrice float64 `json:"avgPurchasePrice"`
}

type holdingResponse struct {
	ID               string  `json:"id"`
	CoinGeckoID      string  `json:"coingeckoId"`
	Symbol           string  `json:"symbol"`
	Name             string  `json:"name"`
	Quantity         float64 `json:"quantity"`
	AvgPurchasePrice float64 `json:"avgPurchasePrice"`
	CreatedAt        string  `json:"createdAt"`
	UpdatedAt        string  `json:"updatedAt"`
}

func toHoldingResponse(h portfolio.Holding) holdingResponse {
	return holdingResponse{
		ID:               h.ID,
		CoinGeckoID:      h.CoinGeckoID,
		Symbol:           h.Symbol,
		Name:             h.Name,
		Quantity:         h.Quantity,
		AvgPurchasePrice: h.AvgPurchasePrice,
		CreatedAt:        h.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:        h.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

// List handles GET /api/holdings — returns all holdings.
func (p *Portfolio) List(w http.ResponseWriter, r *http.Request) {
	holdings, err := p.service.List(r.Context())
	if err != nil {
		p.log.Error("listing holdings", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list holdings")
		return
	}

	resp := make([]holdingResponse, len(holdings))
	for i, h := range holdings {
		resp[i] = toHoldingResponse(h)
	}

	writeJSON(w, http.StatusOK, resp)
}

// Create handles POST /api/holdings — adds a new holding.
func (p *Portfolio) Create(w http.ResponseWriter, r *http.Request) {
	var req createHoldingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	h := portfolio.Holding{
		CoinGeckoID:      req.CoinGeckoID,
		Symbol:           req.Symbol,
		Name:             req.Name,
		Quantity:         req.Quantity,
		AvgPurchasePrice: req.AvgPurchasePrice,
	}

	created, err := p.service.Create(r.Context(), h)
	if err != nil {
		p.handleServiceError(w, err, "creating holding")
		return
	}

	writeJSON(w, http.StatusCreated, toHoldingResponse(created))
}

// Update handles PUT /api/holdings/{id} — modifies quantity and price.
func (p *Portfolio) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req updateHoldingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	h := portfolio.Holding{
		ID:               id,
		Quantity:         req.Quantity,
		AvgPurchasePrice: req.AvgPurchasePrice,
	}

	updated, err := p.service.Update(r.Context(), h)
	if err != nil {
		p.handleServiceError(w, err, "updating holding")
		return
	}

	writeJSON(w, http.StatusOK, toHoldingResponse(updated))
}

// Delete handles DELETE /api/holdings/{id} — removes a holding.
func (p *Portfolio) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := p.service.Delete(r.Context(), id); err != nil {
		p.handleServiceError(w, err, "deleting holding")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (p *Portfolio) handleServiceError(w http.ResponseWriter, err error, action string) {
	switch {
	case errors.Is(err, portfolio.ErrInvalidInput):
		writeError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, portfolio.ErrDuplicateHolding):
		writeError(w, http.StatusConflict, err.Error())
	case errors.Is(err, portfolio.ErrNotFound):
		writeError(w, http.StatusNotFound, err.Error())
	default:
		p.log.Error(action, "error", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
	}
}
