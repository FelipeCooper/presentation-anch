CREATE TABLE holdings (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coingecko_id       TEXT NOT NULL UNIQUE,
    symbol             TEXT NOT NULL,
    name               TEXT NOT NULL,
    quantity           NUMERIC NOT NULL CHECK (quantity > 0),
    avg_purchase_price NUMERIC NOT NULL CHECK (avg_purchase_price > 0),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
