const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramAlert(
  productName: string,
  store: string,
  price: number,
  targetPrice: number,
  url: string,
  discount?: string,
  coupon?: string
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram not configured — skipping alert');
    return false;
  }

  const storeNames: Record<string, string> = {
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

  const storeName = storeNames[store] || store;
  const savings = targetPrice - price;

  let message = `🔔 *ALERTA DE PREÇO*\n\n`;
  message += `📦 *${productName}*\n`;
  message += `🏪 ${storeName}\n`;
  message += `💰 *R$ ${price.toFixed(2)}*\n`;
  message += `🎯 Meta: R$ ${targetPrice.toFixed(2)}\n`;
  message += `✅ Economia: R$ ${savings.toFixed(2)}\n`;

  if (discount) {
    message += `🏷️ Desconto: ${discount}\n`;
  }
  if (coupon) {
    message += `🎟️ Cupom: ${coupon}\n`;
  }

  message += `\n🔗 [Ver oferta](${url})`;

  try {
    const apiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Telegram API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram alert:', error);
    return false;
  }
}
