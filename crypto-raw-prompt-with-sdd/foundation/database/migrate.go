// Package database provides PostgreSQL connection pool setup and migration support.
package database

import (
	"embed"
	"errors"
	"fmt"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// Migrate runs all pending database migrations against the provided database URL.
// It uses embedded SQL migration files from the migrations/ directory.
func Migrate(databaseURL string) error {
	source, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("creating migration source: %w", err)
	}

	// The pgx/v5 migrate driver requires the "pgx5://" scheme.
	migrateURL := databaseURL
	if strings.HasPrefix(migrateURL, "postgres://") {
		migrateURL = "pgx5://" + strings.TrimPrefix(migrateURL, "postgres://")
	} else if strings.HasPrefix(migrateURL, "postgresql://") {
		migrateURL = "pgx5://" + strings.TrimPrefix(migrateURL, "postgresql://")
	}

	m, err := migrate.NewWithSourceInstance("iofs", source, migrateURL)
	if err != nil {
		return fmt.Errorf("creating migrate instance: %w", err)
	}
	defer func() {
		sourceErr, dbErr := m.Close()
		_ = sourceErr // migration source close errors are non-actionable
		_ = dbErr     // database close errors are non-actionable during shutdown
	}()

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("running migrations: %w", err)
	}

	return nil
}
