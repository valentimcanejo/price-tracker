import * as cheerio from 'cheerio';
import { ScrapeResult } from '@/types';
import { fetchPage } from '../fetcher';

export async function scrapeKabum(url: string): Promise<ScrapeResult> {
  const base: ScrapeResult = {
    store: 'kabum',
    url,
    currentPrice: null,
    originalPrice: null,
    discount: null,
    coupon: null,
    available: false,
  };

  try {
    const html = await fetchPage(url, 'kabum');
    const $ = cheerio.load(html);

    const priceEl = $('.finalPrice, .priceCard__PriceCardStyled-sc-1bu4bek-0 h4, [class*="finalPrice"]').first().text();
    if (priceEl) {
      base.currentPrice = parsePrice(priceEl);
      base.available = true;
    }

    if (!base.currentPrice) {
      const jsonLd = extractJsonLd($);
      if (jsonLd.price) {
        base.currentPrice = jsonLd.price;
        base.available = jsonLd.inStock;
      }
    }

    if (!base.currentPrice) {
      const scriptMatch = html.match(/"price"\s*:\s*([\d.]+)/);
      if (scriptMatch) {
        base.currentPrice = parseFloat(scriptMatch[1]);
        base.available = true;
      }
    }

    const oldPriceEl = $('.oldPriceCard, [class*="oldPrice"]').first().text();
    if (oldPriceEl) {
      base.originalPrice = parsePrice(oldPriceEl);
    }

    const discountEl = $('.discountTag, [class*="discount"]').first().text();
    if (discountEl && discountEl.includes('%')) {
      base.discount = discountEl.trim();
    }

    const couponEl = $('[class*="coupon"], [class*="cupom"]').first().text();
    if (couponEl) {
      base.coupon = couponEl.trim();
    }

    if (!base.coupon) {
      const couponMatch = html.match(/[Uu]se o cupom\s+(\S+)\s+e ganhe\s+(\d+%\s*OFF)/);
      if (couponMatch) {
        base.coupon = `${couponMatch[1]} - ${couponMatch[2]}`;
      }
    }

    if (!base.coupon) {
      const altMatch = html.match(/cupom\s+([A-Z0-9]+).*?(\d+%\s*(?:OFF|off|desconto))/);
      if (altMatch) {
        base.coupon = `${altMatch[1]} - ${altMatch[2]}`;
      }
    }

    const unavailable = $('[class*="outOfStock"], [class*="unavailable"]').length > 0;
    if (unavailable && base.currentPrice) {
      base.available = false;
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

function extractJsonLd($: ReturnType<typeof cheerio.load>): { price: number | null; inStock: boolean } {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const data = JSON.parse($(scripts[i]).html() || '');
      const offers = data?.offers || data?.['@graph']?.[0]?.offers;
      const offer = Array.isArray(offers) ? offers[0] : offers;
      if (offer) {
        const price = offer.price || offer.lowPrice;
        const availability = String(offer.availability || '');
        const inStock = !availability.includes('OutOfStock');
        if (price) return { price: parseFloat(String(price)), inStock };
      }
    } catch {
      continue;
    }
  }
  return { price: null, inStock: false };
}
