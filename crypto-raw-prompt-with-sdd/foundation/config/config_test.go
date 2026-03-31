package config

import (
	"testing"
	"time"
)

func TestLoad(t *testing.T) {
	tests := []struct {
		name    string
		envVars map[string]string
		want    Config
		wantErr bool
	}{
		{
			name: "all required vars set with defaults",
			envVars: map[string]string{
				"DATABASE_URL":      "postgres://localhost:5432/test",
				"COINGECKO_API_KEY": "test-key",
			},
			want: Config{
				DatabaseURL:       "postgres://localhost:5432/test",
				CoinGeckoAPIKey:   "test-key",
				CoinGeckoBaseURL:  "https://api.coingecko.com/api/v3",
				ServerPort:        "8080",
				PollInterval:      180 * time.Second,
				HTTPClientTimeout: 10 * time.Second,
			},
		},
		{
			name: "all vars explicitly set",
			envVars: map[string]string{
				"DATABASE_URL":                "postgres://localhost:5432/custom",
				"COINGECKO_API_KEY":           "custom-key",
				"COINGECKO_BASE_URL":          "https://custom.api.com",
				"SERVER_PORT":                 "3000",
				"POLL_INTERVAL_SECONDS":       "60",
				"HTTP_CLIENT_TIMEOUT_SECONDS": "5",
			},
			want: Config{
				DatabaseURL:       "postgres://localhost:5432/custom",
				CoinGeckoAPIKey:   "custom-key",
				CoinGeckoBaseURL:  "https://custom.api.com",
				ServerPort:        "3000",
				PollInterval:      60 * time.Second,
				HTTPClientTimeout: 5 * time.Second,
			},
		},
		{
			name: "missing DATABASE_URL",
			envVars: map[string]string{
				"COINGECKO_API_KEY": "test-key",
			},
			wantErr: true,
		},
		{
			name: "missing COINGECKO_API_KEY",
			envVars: map[string]string{
				"DATABASE_URL": "postgres://localhost:5432/test",
			},
			wantErr: true,
		},
		{
			name: "invalid POLL_INTERVAL_SECONDS",
			envVars: map[string]string{
				"DATABASE_URL":          "postgres://localhost:5432/test",
				"COINGECKO_API_KEY":     "test-key",
				"POLL_INTERVAL_SECONDS": "not-a-number",
			},
			wantErr: true,
		},
		{
			name: "negative POLL_INTERVAL_SECONDS",
			envVars: map[string]string{
				"DATABASE_URL":          "postgres://localhost:5432/test",
				"COINGECKO_API_KEY":     "test-key",
				"POLL_INTERVAL_SECONDS": "-5",
			},
			wantErr: true,
		},
		{
			name: "invalid HTTP_CLIENT_TIMEOUT_SECONDS",
			envVars: map[string]string{
				"DATABASE_URL":                "postgres://localhost:5432/test",
				"COINGECKO_API_KEY":           "test-key",
				"HTTP_CLIENT_TIMEOUT_SECONDS": "abc",
			},
			wantErr: true,
		},
		{
			name: "negative HTTP_CLIENT_TIMEOUT_SECONDS",
			envVars: map[string]string{
				"DATABASE_URL":                "postgres://localhost:5432/test",
				"COINGECKO_API_KEY":           "test-key",
				"HTTP_CLIENT_TIMEOUT_SECONDS": "0",
			},
			wantErr: true,
		},
	}

	// Keys to clean up between tests
	allKeys := []string{
		"DATABASE_URL", "COINGECKO_API_KEY", "COINGECKO_BASE_URL",
		"SERVER_PORT", "POLL_INTERVAL_SECONDS", "HTTP_CLIENT_TIMEOUT_SECONDS",
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Clear all env vars
			for _, key := range allKeys {
				t.Setenv(key, "")
			}
			// Set only the test's env vars
			for key, val := range tt.envVars {
				t.Setenv(key, val)
			}

			got, err := Load()
			if tt.wantErr {
				if err == nil {
					t.Fatal("expected error but got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tt.want {
				t.Errorf("got %+v, want %+v", got, tt.want)
			}
		})
	}
}
