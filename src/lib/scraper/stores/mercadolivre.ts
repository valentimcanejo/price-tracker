import * as cheerio from 'cheerio';
import { ScrapeResult } from '@/types';
import { fetchPage } from '../fetcher';

export async function scrapeMercadoLivre(url: string): Promise<ScrapeResult> {
  const base: ScrapeResult = {
    store: 'mercadolivre',
    url,
    currentPrice: null,
    originalPrice: null,
    discount: null,
    coupon: null,
    available: false,
  };

  try {
    const html = await fetchPage(url, 'mercadolivre');
    const $ = cheerio.load(html);

    const priceContainer = $('.ui-pdp-price__second-line .andes-money-amount__fraction').first().text();
    const priceCents = $('.ui-pdp-price__second-line .andes-money-amount__cents').first().text();

    if (priceContainer) {
      const full = priceCents ? `${priceContainer},${priceCents}` : priceContainer;
      base.currentPrice = parsePrice(full);
      base.available = true;
    }

    if (!base.currentPrice) {
      const metaPrice = $('meta[itemprop="price"]').attr('content');
      if (metaPrice) {
        base.currentPrice = parseFloat(metaPrice);
        base.available = true;
      }
    }

    if (!base.currentPrice) {
      const jsonLd = extractJsonLdPrice($);
      if (jsonLd) {
        base.currentPrice = jsonLd;
        base.available = true;
      }
    }

    const oldPriceEl = $('.ui-pdp-price__original-value .andes-money-amount__fraction').first().text();
    if (oldPriceEl) {
      base.originalPrice = parsePrice(oldPriceEl);
    }

    const discountEl = $('.ui-pdp-price__second-line__label, .andes-money-amount__discount').first().text();
    if (discountEl && discountEl.includes('%')) {
      base.discount = discountEl.trim();
    }

    const couponEl = $('.ui-pdp-promotions-pill-label__text, .coupon-label').first().text();
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
