import * as cheerio from 'cheerio';
import { ScrapeResult } from '@/types';
import { fetchPage } from '../fetcher';

export async function scrapeAmazon(url: string): Promise<ScrapeResult> {
  const base: ScrapeResult = {
    store: 'amazon',
    url,
    currentPrice: null,
    originalPrice: null,
    discount: null,
    coupon: null,
    available: false,
  };

  try {
    const html = await fetchPage(url, 'amazon');
    const $ = cheerio.load(html);

    const priceWhole = $('#corePriceDisplay_desktop_feature_div .a-price-whole').first().text().trim();
    const priceFraction = $('#corePriceDisplay_desktop_feature_div .a-price-fraction').first().text().trim();

    if (priceWhole) {
      base.currentPrice = parsePrice(`${priceWhole}${priceFraction}`);
      base.available = true;
    }

    if (!base.currentPrice) {
      const priceSymbol = $('#priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen').first().text();
      if (priceSymbol) {
        base.currentPrice = parsePrice(priceSymbol);
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

    if (!base.currentPrice) {
      const priceAmountMatch = html.match(/"priceAmount"\s*:\s*"?([\d.,]+)/);
      if (priceAmountMatch) {
        base.currentPrice = parseFloat(priceAmountMatch[1].replace(',', '.'));
        base.available = true;
      }
    }

    const oldPrice = $('.a-text-price .a-offscreen, .priceBlockStrikePriceString').first().text();
    if (oldPrice) {
      base.originalPrice = parsePrice(oldPrice);
    }

    const savingsText = $('.savingsPercentage, #dealprice_savings .priceBlockSavingsString').first().text();
    if (savingsText) {
      base.discount = savingsText.trim();
    }

    const couponText = $('#couponTextpct498, .couponBadge, [data-csa-c-coupon], [id*="coupon"], .promoPriceBlockMessage').first().text();
    if (couponText && (couponText.includes('cupom') || couponText.includes('coupon') || couponText.includes('%'))) {
      base.coupon = couponText.trim();
    }

    if (!base.coupon) {
      const couponMatch = html.match(/[Aa]plique\s+(?:o\s+)?cupom\s+(\S+).*?(\d+%\s*(?:OFF|off|desconto))/);
      if (couponMatch) {
        base.coupon = `${couponMatch[1]} - ${couponMatch[2]}`;
      }
    }

    if (!base.coupon) {
      const couponMatch2 = html.match(/cupom.*?(\d+%\s*(?:de\s+)?desconto)/i);
      if (couponMatch2) {
        base.coupon = couponMatch2[0].substring(0, 80).trim();
      }
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
