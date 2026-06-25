import * as cheerio from 'cheerio';
import { ScrapeResult } from '@/types';
import { fetchPage } from '../fetcher';

export async function scrapeCasasBahia(url: string): Promise<ScrapeResult> {
  const base: ScrapeResult = {
    store: 'casasbahia',
    url,
    currentPrice: null,
    originalPrice: null,
    discount: null,
    coupon: null,
    available: false,
  };

  try {
    const html = await fetchPage(url, 'casasbahia');
    const $ = cheerio.load(html);

    const priceEl = $('[data-testid="price-value"], .product-price__highlight, .price__SalesPrice').first().text();
    if (priceEl) {
      base.currentPrice = parsePrice(priceEl);
      base.available = true;
    }

    if (!base.currentPrice) {
      base.currentPrice = extractJsonLdPrice($);
      if (base.currentPrice) base.available = true;
    }

    if (!base.currentPrice) {
      const scriptMatch = html.match(/"price"\s*:\s*([\d.]+)/);
      if (scriptMatch) {
        base.currentPrice = parseFloat(scriptMatch[1]);
        base.available = true;
      }
    }

    const oldPriceEl = $('[data-testid="price-original"], .product-price__old-price').first().text();
    if (oldPriceEl) base.originalPrice = parsePrice(oldPriceEl);

    const discountEl = $('[data-testid="price-discount"], .product-price__discount').first().text();
    if (discountEl && discountEl.includes('%')) base.discount = discountEl.trim();

    return base;
  } catch (error) {
    return { ...base, error: (error as Error).message };
  }
}

function parsePrice(text: string): number | null {
  const cleaned = text.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function extractJsonLdPrice($: ReturnType<typeof cheerio.load>): number | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const data = JSON.parse($(scripts[i]).html() || '');
      const offers = data?.offers || data?.['@graph']?.[0]?.offers;
      if (offers) {
        const price = offers.price || offers.lowPrice || offers[0]?.price;
        if (price) return parseFloat(String(price));
      }
    } catch { continue; }
  }
  return null;
}
