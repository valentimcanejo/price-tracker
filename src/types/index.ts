export interface Product {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  stores: StoreConfig[];
  targetPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreConfig {
  store: StoreName;
  url: string;
  enabled: boolean;
}

export type StoreName = 'amazon' | 'mercadolivre' | 'magazineluiza' | 'kabum' | 'casasbahia' | 'ponto' | 'fastshop' | 'americanas' | 'submarino';

export interface PriceRecord {
  id: string;
  productId: string;
  store: StoreName;
  url: string;
  currentPrice: number;
  originalPrice?: number;
  discount?: string;
  coupon?: string;
  available: boolean;
  scrapedAt: string;
}

export interface PriceAlert {
  id: string;
  productId: string;
  store: StoreName;
  price: number;
  targetPrice: number;
  url: string;
  sentAt: string;
  channel: 'telegram' | 'email';
}

export interface ScrapeResult {
  store: StoreName;
  url: string;
  currentPrice: number | null;
  originalPrice: number | null;
  discount: string | null;
  coupon: string | null;
  available: boolean;
  error?: string;
}

export interface DashboardProduct extends Product {
  latestPrices: Record<StoreName, PriceRecord | null>;
  lowestPrice: number | null;
  lowestStore: StoreName | null;
  historicalLow: number | null;
}
