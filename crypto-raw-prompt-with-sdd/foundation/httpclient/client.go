// Package httpclient provides a reusable HTTP client with configurable timeout.
package httpclient

import (
	"net/http"
	"time"
)

// New creates an *http.Client with the specified timeout.
func New(timeout time.Duration) *http.Client {
	return &http.Client{
		Timeout: timeout,
		Transport: &http.Transport{
			MaxIdleConns:        10,
			MaxIdleConnsPerHost: 5,
			IdleConnTimeout:     90 * time.Second,
		},
	}
}
