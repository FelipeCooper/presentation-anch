// Package config loads and validates application configuration from environment variables.
package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config holds all application configuration values.
type Config struct {
	DatabaseURL       string
	CoinGeckoAPIKey   string
	CoinGeckoBaseURL  string
	ServerPort        string
	PollInterval      time.Duration
	HTTPClientTimeout time.Duration
}

// Load reads configuration from environment variables and validates required fields.
func Load() (Config, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL environment variable is required")
	}

	apiKey := os.Getenv("COINGECKO_API_KEY")
	if apiKey == "" {
		return Config{}, fmt.Errorf("COINGECKO_API_KEY environment variable is required")
	}

	baseURL := os.Getenv("COINGECKO_BASE_URL")
	if baseURL == "" {
		baseURL = "https://api.coingecko.com/api/v3"
	}

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	pollInterval := 180 * time.Second
	if v := os.Getenv("POLL_INTERVAL_SECONDS"); v != "" {
		secs, err := strconv.Atoi(v)
		if err != nil {
			return Config{}, fmt.Errorf("POLL_INTERVAL_SECONDS must be a valid integer: %w", err)
		}
		if secs <= 0 {
			return Config{}, fmt.Errorf("POLL_INTERVAL_SECONDS must be positive")
		}
		pollInterval = time.Duration(secs) * time.Second
	}

	httpTimeout := 10 * time.Second
	if v := os.Getenv("HTTP_CLIENT_TIMEOUT_SECONDS"); v != "" {
		secs, err := strconv.Atoi(v)
		if err != nil {
			return Config{}, fmt.Errorf("HTTP_CLIENT_TIMEOUT_SECONDS must be a valid integer: %w", err)
		}
		if secs <= 0 {
			return Config{}, fmt.Errorf("HTTP_CLIENT_TIMEOUT_SECONDS must be positive")
		}
		httpTimeout = time.Duration(secs) * time.Second
	}

	return Config{
		DatabaseURL:       dbURL,
		CoinGeckoAPIKey:   apiKey,
		CoinGeckoBaseURL:  baseURL,
		ServerPort:        port,
		PollInterval:      pollInterval,
		HTTPClientTimeout: httpTimeout,
	}, nil
}
