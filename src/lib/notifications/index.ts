import { Product, ScrapeResult } from '@/types';
import { sendTelegramAlert } from './telegram';
import { wasAlertSentRecently, saveAlert } from '../db';
import { applyDiscount } from '../scraper/coupon-utils';

const recentAlerts = new Map<string, number>();
const ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function makeAlertKey(productId: string, store: string, price: number): string {
  return `${productId}:${store}:${price}`;
}

function wasAlertSentInMemory(productId: string, store: string, price: number): boolean {
  const key = makeAlertKey(productId, store, price);
  const lastSent = recentAlerts.get(key);
  if (!lastSent) return false;
  return Date.now() - lastSent < ALERT_COOLDOWN_MS;
}

function markAlertSentInMemory(productId: string, store: string, price: number): void {
  const key = makeAlertKey(productId, store, price);
  recentAlerts.set(key, Date.now());
}

export async function checkAndNotify(
  product: Product,
  results: ScrapeResult[]
): Promise<void> {
  for (const result of results) {
    if (!result.currentPrice || !result.available) continue;
    const finalPrice = applyDiscount(result.currentPrice, result.coupon) ?? result.currentPrice;
    if (finalPrice > product.targetPrice) continue;

    if (wasAlertSentInMemory(product.id, result.store, result.currentPrice)) continue;

    let alreadySent = false;
    try {
      alreadySent = await wasAlertSentRecently(
        product.id,
        result.store,
        result.currentPrice
      );
    } catch {
      // Index not ready — rely on in-memory check above
    }

    if (alreadySent) {
      markAlertSentInMemory(product.id, result.store, result.currentPrice);
      continue;
    }

    const sent = await sendTelegramAlert(
      product.name,
      result.store,
      result.currentPrice,
      product.targetPrice,
      result.url,
      result.discount ?? undefined,
      result.coupon ?? undefined
    );

    if (sent) {
      markAlertSentInMemory(product.id, result.store, result.currentPrice);
      try {
        await saveAlert({
          productId: product.id,
          store: result.store,
          price: result.currentPrice,
          targetPrice: product.targetPrice,
          url: result.url,
          sentAt: new Date().toISOString(),
          channel: 'telegram',
        });
      } catch {
        // Alert saved in memory even if DB fails
      }
    }
  }
}
