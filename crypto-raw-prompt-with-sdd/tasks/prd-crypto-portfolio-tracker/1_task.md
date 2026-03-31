# Task 1.0: Project Setup & Foundation Layer

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Initialize the Go module, set up the foundation layer packages (database, config, logger, httpclient), create PostgreSQL migration files, and verify that the app can connect to a running PostgreSQL instance and run migrations.

<requirements>
- Go module initialized with appropriate module path
- PostgreSQL connection via pgxpool with configurable DATABASE_URL
- golang-migrate runner that auto-runs migrations on startup
- Migration SQL files for `holdings` table (000001) and `coins` table with pg_trgm index (000002)
- Down migrations for both tables
- Config loader reading environment variables: DATABASE_URL, COINGECKO_API_KEY, POLL_INTERVAL, PORT
- slog logger configured with JSON output
- Reusable HTTP client with configurable timeout (default 10s)
- Pool config: MaxConns=10, MinConns=2
</requirements>

## Subtasks

- [ ] 1.1 Run `go mod init` and add initial dependencies (pgx, golang-migrate, chi)
- [ ] 1.2 Create `foundation/config/config.go` — struct with fields for all env vars, loader function with defaults
- [ ] 1.3 Create `foundation/logger/logger.go` — slog JSON handler setup
- [ ] 1.4 Create `foundation/database/database.go` — pgxpool connection setup using DATABASE_URL, with MaxConns/MinConns config
- [ ] 1.5 Create `foundation/database/migrate.go` — golang-migrate runner that reads SQL files from `foundation/database/migrations/`
- [ ] 1.6 Create `foundation/database/migrations/000001_create_holdings.up.sql` and `.down.sql`
- [ ] 1.7 Create `foundation/database/migrations/000002_create_coins.up.sql` (with pg_trgm extension and indexes) and `.down.sql`
- [ ] 1.8 Create `foundation/httpclient/client.go` — HTTP client wrapper with timeout

## Implementation Details

Refer to **techspec.md** sections:
- "System Architecture > Component Overview" for the foundation package structure
- "Data Models > Database schema" for the exact SQL of both migrations
- "Integration Points > PostgreSQL" for pool config and migration details
- "Integration Points > CoinGecko Demo API" for HTTP client timeout (10s)
- "Standards Compliance" for config via `os.Getenv` and slog logging

Key points:
- The `coins` table migration must enable `pg_trgm` extension (`CREATE EXTENSION IF NOT EXISTS pg_trgm`) before creating the trigram index
- Config should have sensible defaults: PORT=8080, POLL_INTERVAL=180
- The migrate runner should use the `pgx` driver for golang-migrate

## Success Criteria

- `go build ./...` succeeds with no errors
- A main.go (or test) can connect to a local PostgreSQL instance using DATABASE_URL
- Migrations run successfully creating both `holdings` and `coins` tables
- Config loader correctly reads all env vars and applies defaults
- Logger outputs structured JSON logs
- HTTP client respects the configured timeout

## Task Tests

- [ ] Unit tests for `foundation/config/` — verify defaults are applied, verify env vars override defaults
- [ ] Unit tests for `foundation/logger/` — verify logger is created without error
- [ ] Unit tests for `foundation/httpclient/` — verify client timeout is set correctly
- [ ] Integration tests for `foundation/database/` — connect to real PostgreSQL, run migrations up, verify tables exist, run migrations down, verify tables are dropped

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT FINISHED</critical>

## Relevant Files

- `go.mod`, `go.sum`
- `foundation/config/config.go`
- `foundation/logger/logger.go`
- `foundation/database/database.go`
- `foundation/database/migrate.go`
- `foundation/database/migrations/000001_create_holdings.up.sql`
- `foundation/database/migrations/000001_create_holdings.down.sql`
- `foundation/database/migrations/000002_create_coins.up.sql`
- `foundation/database/migrations/000002_create_coins.down.sql`
- `foundation/httpclient/client.go`

## LINEAR
- []
- []
