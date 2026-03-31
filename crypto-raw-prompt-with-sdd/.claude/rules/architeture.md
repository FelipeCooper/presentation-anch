# Go Architecture

Package-oriented DDD with 3 layers. Each layer has a strict responsibility.
Dependency direction: app → domain ← foundation. Domain never imports app or foundation.

## Layer: foundation
External connections and infrastructure concerns.

```
foundation/
├── database/     # PostgreSQL connection, migrations
├── httpclient/   # Reusable HTTP client with retry and timeout
├── logger/       # slog setup and configuration
└── config/       # Environment variable loading and validation
```

Rules:
- Contains all third-party lib initialization
- Exposes interfaces that domain defines, implemented here
- Never contains business logic
- Never imports domain or app

## Layer: domain
Business logic and the interfaces it depends on.

```
domain/
└── portfolio/
    ├── portfolio.go        # Entity and core business logic
    ├── repository.go       # Interface (e.g. PortfolioRepository)
    ├── pricer.go           # Interface (e.g. AssetPricer)
    └── service.go          # Use cases using only the interfaces above
```

Rules:
- Zero external imports — only standard library and other domain packages
- Defines interfaces for everything it needs (repository, external APIs)
- Never knows how interfaces are implemented
- All business rules live here and only here

## Layer: app
Orchestrates domain services and wires everything together.

```
app/
├── server.go       # HTTP server setup
├── handlers/
│   └── portfolio.go  # HTTP handlers, calls domain services
└── wire.go         # Dependency injection: instantiates foundation, injects into domain
```

Rules:
- Imports both domain and foundation
- Handlers are thin: validate input → call service → write response
- No business logic in handlers
- wire.go is the only place where concrete implementations are injected into domain interfaces

## Naming conventions
- don't repeat package name in identifiers (e.g. portfolio.Portfolio, not portfolio.PortfolioService)