import { Product, ScrapeResult } from '@/types';
import { applyDiscount } from '../scraper/coupon-utils';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const STORE_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  mercadolivre: 'Mercado Livre',
  magazineluiza: 'Magazine Luiza',
  kabum: 'KaBuM!',
  casasbahia: 'Casas Bahia',
  ponto: 'Ponto',
  fastshop: 'Fast Shop',
  americanas: 'Americanas',
  submarino: 'Submarino',
};

interface ProductSummary {
  product: Product;
  results: ScrapeResult[];
}

export async function sendDailySummary(
  summaries: ProductSummary[]
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('pt-BR');

  let message = `📊 *RESUMO DE PRECOS*\n📅 ${dateStr} - ${timeStr}\n`;

  for (const { product, results } of summaries) {
    const available = results
      .filter((r) => r.currentPrice && r.available)
      .sort((a, b) => {
        const priceA = applyDiscount(a.currentPrice!, a.coupon) ?? a.currentPrice!;
        const priceB = applyDiscount(b.currentPrice!, b.coupon) ?? b.currentPrice!;
        return priceA - priceB;
      });

    const unavailable = results.filter((r) => r.currentPrice && !r.available);

    message += `\n━━━━━━━━━━━━━━━━━━\n`;
    message += `📦 *${product.name}*\n`;
    message += `🎯 Meta: R$ ${product.targetPrice.toFixed(2)}\n\n`;

    if (available.length > 0) {
      const best = available[0];
      const isBelowTarget = best.currentPrice! <= product.targetPrice;

      if (isBelowTarget) {
        message += `🟢 *ABAIXO DA META!*\n`;
      }

      for (const r of available) {
        const store = STORE_LABELS[r.store] || r.store;
        const finalPrice = applyDiscount(r.currentPrice!, r.coupon) ?? r.currentPrice!;
        const belowMeta = finalPrice <= product.targetPrice;
        const indicator = belowMeta ? '✅' : '⬚';

        if (r.coupon && finalPrice < r.currentPrice!) {
          let line = `${indicator} ${store}: ~R$ ${r.currentPrice!.toFixed(2)}~ → *R$ ${finalPrice.toFixed(2)}*`;
          line += ` 🎟️ ${r.coupon}`;
          message += line + '\n';
        } else {
          let line = `${indicator} ${store}: *R$ ${r.currentPrice!.toFixed(2)}*`;
          if (r.discount) line += ` (${r.discount})`;
          message += line + '\n';
        }
      }
    } else {
      message += `⚠️ Nenhuma loja com preco disponivel\n`;
    }

    if (unavailable.length > 0) {
      const storeNames = unavailable
        .map((r) => STORE_LABELS[r.store] || r.store)
        .join(', ');
      message += `\n🔴 Esgotado: ${storeNames}\n`;
    }
  }

  message += `\n━━━━━━━━━━━━━━━━━━`;

  try {
    const apiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}
