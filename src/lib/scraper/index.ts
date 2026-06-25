import { Product, ScrapeResult, StoreName } from '@/types';
import { scrapeAmazon } from './stores/amazon';
import { scrapeMercadoLivre } from './stores/mercadolivre';
import { scrapeMagazineLuiza } from './stores/magazineluiza';
import { scrapeKabum } from './stores/kabum';
import { scrapeCasasBahia } from './stores/casasbahia';
import { scrapePonto } from './stores/ponto';
import { scrapeFastShop } from './stores/fastshop';
import { scrapeAmericanas } from './stores/americanas';
import { scrapeSubmarino } from './stores/submarino';
import { scrapeGoogleShopping } from './google-shopping';
import { savePriceRecord, getLatestPrice } from '../db';

const scrapers: Record<StoreName, (url: string) => Promise<ScrapeResult>> = {
  amazon: scrapeAmazon,
  mercadolivre: scrapeMercadoLivre,
  magazineluiza: scrapeMagazineLuiza,
  kabum: scrapeKabum,
  casasbahia: scrapeCasasBahia,
  ponto: scrapePonto,
  fastshop: scrapeFastShop,
  americanas: scrapeAmericanas,
  submarino: scrapeSubmarino,
};

const DIRECT_SCRAPE_STORES: StoreName[] = ['amazon', 'kabum'];

export async function scrapeProduct(product: Product): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];
  const coveredStores = new Set<StoreName>();

  const directStores = product.stores.filter(
    (s) => s.enabled && DIRECT_SCRAPE_STORES.includes(s.store)
  );

  const directPromises = directStores.map(async (storeConfig) => {
    const scraper = scrapers[storeConfig.store];
    if (!scraper) return null;

    const result = await scraper(storeConfig.url);
    console.log(`[direct] ${storeConfig.store}: price=${result.currentPrice} available=${result.available}`);
    return result;
  });

  const directSettled = await Promise.allSettled(directPromises);
  for (const r of directSettled) {
    if (r.status === 'fulfilled' && r.value) {
      results.push(r.value);
      coveredStores.add(r.value.store);
    }
  }

  const needsGoogleShopping = product.stores.some(
    (s) => s.enabled && !DIRECT_SCRAPE_STORES.includes(s.store)
  );

  if (needsGoogleShopping) {
    const gsResults = await scrapeGoogleShopping(product.name);
    for (const gsr of gsResults) {
      if (!coveredStores.has(gsr.store)) {
        console.log(`[google] ${gsr.store}: price=${gsr.currentPrice}`);
        results.push(gsr);
        coveredStores.add(gsr.store);
      }
    }
  }

  for (const result of results) {
    if (result.currentPrice === null) continue;

    let isDuplicate = false;
    try {
      const lastPrice = await getLatestPrice(product.id, result.store);
      isDuplicate = !!(
        lastPrice &&
        lastPrice.currentPrice === result.currentPrice &&
        Date.now() - new Date(lastPrice.scrapedAt).getTime() < 6 * 60 * 60 * 1000
      );
    } catch {}

    if (!isDuplicate) {
      const storeConfig = product.stores.find((s) => s.store === result.store);
      await savePriceRecord({
        productId: product.id,
        store: result.store,
        url: storeConfig?.url || result.url,
        currentPrice: result.currentPrice,
        originalPrice: result.originalPrice ?? undefined,
        discount: result.discount ?? undefined,
        coupon: result.coupon ?? undefined,
        available: result.available,
        scrapedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

export async function scrapeAllProducts(products: Product[]): Promise<Map<string, ScrapeResult[]>> {
  const allResults = new Map<string, ScrapeResult[]>();

  for (const product of products) {
    const results = await scrapeProduct(product);
    allResults.set(product.id, results);
    await new Promise((r) => setTimeout(r, 2000));
  }

  return allResults;
}
