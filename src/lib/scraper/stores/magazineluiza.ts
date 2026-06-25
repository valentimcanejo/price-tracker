import * as cheerio from 'cheerio';
import { ScrapeResult } from '@/types';
import { fetchPage } from '../fetcher';

export async function scrapeMagazineLuiza(url: string): Promise<ScrapeResult> {
  const base: ScrapeResult = {
    store: 'magazineluiza',
    url,
    currentPrice: null,
    originalPrice: null,
    discount: null,
    coupon: null,
    available: false,
  };

  try {
    const html = await fetchPage(url, 'magazineluiza');
    const $ = cheerio.load(html);

    const priceEl = $('[data-testid="price-value"], .price-template__text').first().text();
    if (priceEl) {
      base.currentPrice = parsePrice(priceEl);
      base.available = true;
    }

    if (!base.currentPrice) {
      const jsonLd = extractJsonLdPrice($);
      if (jsonLd) {
        base.currentPrice = jsonLd;
        base.available = true;
      }
    }

    if (!base.currentPrice) {
      const scriptContent = html.match(/"price"\s*:\s*([\d.]+)/);
      if (scriptContent) {
        base.currentPrice = parseFloat(scriptContent[1]);
        base.available = true;
      }
    }

    const oldPriceEl = $('[data-testid="price-original"], .price-template__from').first().text();
    if (oldPriceEl) {
      base.originalPrice = parsePrice(oldPriceEl);
    }

    const discountEl = $('[data-testid="price-discount"], .price-template__discount').first().text();
    if (discountEl) {
      base.discount = discountEl.trim();
    }

    const couponEl = $('[data-testid="coupon-badge"], .coupon-info').first().text();
    if (couponEl) {
      base.coupon = couponEl.trim();
    }

    return base;
  } catch (error) {
    return { ...base, error: (error as Error).message };
  }
}

function parsePrice(text: string): number | null {
  const cleaned = text
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
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
    } catch {
      continue;
    }
  }
  return null;
}
