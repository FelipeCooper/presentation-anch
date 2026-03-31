CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE coins (
    coingecko_id TEXT PRIMARY KEY,
    symbol       TEXT NOT NULL,
    name         TEXT NOT NULL
);

CREATE INDEX idx_coins_name_trgm ON coins USING gin (name gin_trgm_ops);
CREATE INDEX idx_coins_symbol ON coins (symbol);
