import { NextRequest, NextResponse } from 'next/server';
import { getPriceHistory } from '@/lib/db';
import { StoreName } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const store = searchParams.get('store') as StoreName | null;
    const days = parseInt(searchParams.get('days') || '30', 10);

    const history = await getPriceHistory(id, store || undefined, days);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching price history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price history' },
      { status: 500 }
    );
  }
}
