package database

import (
	"context"
	"testing"
	"time"
)

func TestNew_InvalidURL(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	_, err := New(ctx, "postgres://invalid:5432/nonexistent?connect_timeout=1")
	if err == nil {
		t.Fatal("expected error for invalid database URL, got nil")
	}
}

func TestNew_MalformedURL(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	_, err := New(ctx, "not-a-valid-url")
	if err == nil {
		t.Fatal("expected error for malformed database URL, got nil")
	}
}

func TestMigrate_InvalidURL(t *testing.T) {
	err := Migrate("pgx5://invalid:5432/nonexistent")
	if err == nil {
		t.Fatal("expected error for invalid database URL, got nil")
	}
}
