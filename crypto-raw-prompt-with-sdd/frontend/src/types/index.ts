export interface Holding {
  id: string;
  coingeckoId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPurchasePrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHoldingRequest {
  coingeckoId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPurchasePrice: number;
}

export interface UpdateHoldingRequest {
  quantity: number;
  avgPurchasePrice: number;
}

export interface PriceData {
  usd: number;
  usd24hChange: number;
  lastUpdatedAt: number;
}

export type PriceMap = Record<string, PriceData>;

export interface Coin {
  coingeckoId: string;
  symbol: string;
  name: string;
}
