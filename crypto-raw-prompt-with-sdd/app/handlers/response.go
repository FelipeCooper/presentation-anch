package handlers

import (
	"encoding/json"
	"net/http"
)

type errorResponse struct {
	Error string `json:"error"`
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	// Encoding errors at this point are non-recoverable (headers already sent)
	_ = json.NewEncoder(w).Encode(v) // intentional: response already committed
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, errorResponse{Error: msg})
}

// WriteHealthOK writes a 200 health check response.
func WriteHealthOK(w http.ResponseWriter) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// WriteHealthError writes a health check error response.
func WriteHealthError(w http.ResponseWriter, status int, msg string) {
	writeError(w, status, msg)
}
