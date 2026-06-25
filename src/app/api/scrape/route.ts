import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/db';
import { scrapeAllProducts } from '@/lib/scraper';
import { checkAndNotify } from '@/lib/notifications';
import { sendDailySummary } from '@/lib/notifications/summary';

export const maxDuration = 120;

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
  return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const products = await getAllProducts();

    if (products.length === 0) {
      return NextResponse.json({ message: 'No products to scrape' });
    }

    const allResults = await scrapeAllProducts(products);

    const notifications: string[] = [];
    for (const product of products) {
      const results = allResults.get(product.id);
      if (results) {
        await checkAndNotify(product, results);
        for (const r of results) {
          if (r.currentPrice && r.available && r.currentPrice <= product.targetPrice) {
            notifications.push(`${product.name} @ ${r.store}: R$${r.currentPrice}`);
          }
        }
      }
    }

    const { searchParams } = new URL(request.url);
    const sendSummary = searchParams.get('summary') === 'true';

    if (sendSummary) {
      const productSummaries = products.map((product) => ({
        product,
        results: allResults.get(product.id) || [],
      }));
      await sendDailySummary(productSummaries);
    }

    const summary = Array.from(allResults.entries()).map(([productId, results]) => ({
      productId,
      results: results.map((r) => ({
        store: r.store,
        price: r.currentPrice,
        available: r.available,
        discount: r.discount,
        coupon: r.coupon,
        error: r.error,
      })),
    }));

    return NextResponse.json({
      message: `Scraped ${products.length} products`,
      summary,
      alerts: notifications,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      { error: 'Scrape failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return POST(request);
}
