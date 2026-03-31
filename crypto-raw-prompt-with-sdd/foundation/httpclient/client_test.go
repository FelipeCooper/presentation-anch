package httpclient

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestNew(t *testing.T) {
	tests := []struct {
		name    string
		timeout time.Duration
	}{
		{name: "5 second timeout", timeout: 5 * time.Second},
		{name: "10 second timeout", timeout: 10 * time.Second},
		{name: "30 second timeout", timeout: 30 * time.Second},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client := New(tt.timeout)
			if client == nil {
				t.Fatal("expected non-nil client")
			}
			if client.Timeout != tt.timeout {
				t.Errorf("got timeout %v, want %v", client.Timeout, tt.timeout)
			}
		})
	}
}

func TestNew_MakesRequest(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, err := w.Write([]byte(`{"status":"ok"}`))
		if err != nil {
			t.Errorf("failed to write response: %v", err)
		}
	}))
	defer server.Close()

	client := New(5 * time.Second)
	resp, err := client.Get(server.URL)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			t.Errorf("failed to close response body: %v", err)
		}
	}()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("got status %d, want %d", resp.StatusCode, http.StatusOK)
	}
}
