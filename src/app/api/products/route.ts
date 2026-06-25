import { NextRequest, NextResponse } from 'next/server';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getLatestPrice,
  getHistoricalLow,
} from '@/lib/db';
import { DashboardProduct, StoreName } from '@/types';

export async function GET() {
  try {
    const products = await getAllProducts();

    const dashboardProducts: DashboardProduct[] = await Promise.all(
      products.map(async (product) => {
        const stores: StoreName[] = ['amazon', 'mercadolivre', 'magazineluiza', 'kabum', 'casasbahia', 'ponto', 'fastshop', 'americanas', 'submarino'];
        const latestPrices: Record<string, any> = {};

        let lowestPrice: number | null = null;
        let lowestStore: StoreName | null = null;

        for (const store of stores) {
          try {
            const price = await getLatestPrice(product.id, store);
            latestPrices[store] = price;

            if (price?.currentPrice && price.available) {
              if (lowestPrice === null || price.currentPrice < lowestPrice) {
                lowestPrice = price.currentPrice;
                lowestStore = store;
              }
            }
          } catch {
            latestPrices[store] = null;
          }
        }

        let historicalLow: number | null = null;
        try {
          historicalLow = await getHistoricalLow(product.id);
        } catch {}

        return {
          ...product,
          latestPrices: latestPrices as any,
          lowestPrice,
          lowestStore,
          historicalLow,
        };
      })
    );

    return NextResponse.json(dashboardProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, imageUrl, stores, targetPrice } = body;

    if (!name || !stores || !targetPrice) {
      return NextResponse.json(
        { error: 'name, stores, and targetPrice are required' },
        { status: 400 }
      );
    }

    const product = await createProduct({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      imageUrl,
      stores,
      targetPrice,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await updateProduct(id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await deleteProduct(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
