# Crypto Portfolio Tracker

A cryptocurrency portfolio tracker with a Go backend and React frontend. Track holdings, view real-time prices from CoinGecko, and monitor portfolio performance.

## Prerequisites

- **Go** (latest stable)
- **Node.js** (v18+)
- **PostgreSQL** (v14+)
- A free [CoinGecko Demo API key](https://www.coingecko.com/en/api/pricing)

## Setup

### 1. Database

Create a PostgreSQL database:

```sql
CREATE DATABASE crypto;
```

The `pg_trgm` extension is required for coin search (the migration will enable it automatically).

### 2. Environment Variables

Copy the `.env` file and fill in your values:

```bash
cp .env .env.local
```

Required variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `COINGECKO_API_KEY` | Yes | — | CoinGecko demo API key |
| `COINGECKO_BASE_URL` | No | `https://api.coingecko.com/api/v3` | CoinGecko API base URL |
| `SERVER_PORT` | No | `8080` | Backend HTTP port |
| `POLL_INTERVAL_SECONDS` | No | `180` | Coin list refresh interval |
| `HTTP_CLIENT_TIMEOUT_SECONDS` | No | `10` | External HTTP request timeout |

### 3. Run the Backend

```bash
# Load env vars
export $(cat .env | grep -v '^#' | xargs)

# Start the server (runs migrations automatically)
go run main.go
```

The backend starts at `http://localhost:8080`. Database migrations run on startup.

### 4. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:5173` and proxies `/api/*` requests to the backend.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/holdings` | List all holdings |
| `POST` | `/api/holdings` | Create a holding |
| `PUT` | `/api/holdings/{id}` | Update a holding |
| `DELETE` | `/api/holdings/{id}` | Delete a holding |
| `GET` | `/api/prices` | Fetch current prices |
| `GET` | `/api/coins?q=bitcoin` | Search coins |
| `GET` | `/healthz` | Health check |

## Testing

```bash
# Frontend unit tests
cd frontend && npm test

# E2E tests (requires both backend and frontend running)
cd frontend && npm run test:e2e
```

## Architecture

Three-layer package-oriented design:

- **app/** — HTTP server, handlers, dependency wiring
- **domain/** — Business logic, interfaces (zero external imports)
- **foundation/** — Database, HTTP client, CoinGecko client, config

Dependency direction: `app → domain ← foundation`. Domain never imports the other layers.
