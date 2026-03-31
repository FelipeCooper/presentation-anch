# Stack

## Backend
- Language: Go (latest stable)
- HTTP: net/http standard library or chi router
- Database: PostgreSQL with pgx driver
- Config: environment variables via os.Getenv, never hardcoded
- Logging: slog (standard library)

## Frontend
- React + TypeScript (strict mode)
- Build tool: Vite
- Data fetching: TanStack Query (react-query)
- Charts: Recharts
- Styling: Tailwind CSS
- HTTP client: native fetch (no axios)

## General rules
- Never use `any` in TypeScript
- No default exports in Go packages
- All errors must be handled explicitly — never discard with `_` unless intentional and commented
- No `console.log` in production code — use the logger from foundation layer