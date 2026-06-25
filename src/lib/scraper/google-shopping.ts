import { ScrapeResult, StoreName } from '@/types';

const STORE_MAP: Record<string, StoreName> = {
  'kabum': 'kabum',
  'kabum!': 'kabum',
  'amazon': 'amazon',
  'amazon.com.br': 'amazon',
  'mercado livre': 'mercadolivre',
  'mercadolivre': 'mercadolivre',
  'magazine luiza': 'magazineluiza',
  'magalu': 'magazineluiza',
  'casas bahia': 'casasbahia',
  'ponto': 'ponto',
  'ponto frio': 'ponto',
  'pontofrio': 'ponto',
  'fast shop': 'fastshop',
  'fastshop': 'fastshop',
  'americanas': 'americanas',
  'submarino': 'submarino',
};

interface ShoppingResult {
  title: string;
  source: string;
  price: string;
  extracted_price: number;
  link: string;
}

function matchStore(source: string): StoreName | null {
  const lower = source.toLowerCase().trim();
  for (const [key, value] of Object.entries(STORE_MAP)) {
    if (lower.includes(key)) return value;
  }
  return null;
}

export async function scrapeGoogleShopping(query: string, minPrice: number = 1000): Promise<ScrapeResult[]> {
  const apiKey = process.env.SCRAPER_API_KEY;
  if (!apiKey) return [];

  const url = `https://api.scraperapi.com/structured/google/shopping?api_key=${apiKey}&query=${encodeURIComponent(query)}&country=br&tld=com.br&num=40`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      console.error(`Google Shopping API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const results: ScrapeResult[] = [];
    const seenStores = new Set<StoreName>();

    const items: ShoppingResult[] = [
      ...(data.shopping_results || []),
      ...(data.inline_shopping_results || []),
    ];

    for (const item of items) {
      const store = matchStore(item.source);
      if (!store || seenStores.has(store)) continue;
      if (!item.extracted_price || item.extracted_price <= 0) continue;
      if (item.extracted_price < minPrice) continue;

      seenStores.add(store);
      results.push({
        store,
        url: item.link || '',
        currentPrice: item.extracted_price,
        originalPrice: null,
        discount: null,
        coupon: null,
        available: true,
      });
    }

    return results;
  } catch (error) {
    console.error('Google Shopping scrape error:', error);
    return [];
  }
}
