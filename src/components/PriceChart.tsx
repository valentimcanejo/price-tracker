'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { PriceRecord, StoreName } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STORE_COLORS: Record<StoreName, string> = {
  amazon: '#FF9900',
  mercadolivre: '#FFE600',
  magazineluiza: '#0086FF',
  kabum: '#FF6500',
  casasbahia: '#E31E24',
  ponto: '#6C2D91',
  fastshop: '#00A651',
  americanas: '#E60014',
  submarino: '#0086C8',
};

const STORE_LABELS: Record<StoreName, string> = {
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

interface PriceChartProps {
  productId: string;
  targetPrice: number;
}

type ChartDataPoint = {
  date: string;
  timestamp: number;
} & Partial<Record<StoreName, number>>;

export default function PriceChart({ productId, targetPrice }: PriceChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${productId}/history?days=${days}`);
        const records: PriceRecord[] = await res.json();

        const grouped = new Map<string, ChartDataPoint>();

        for (const record of records) {
          const dateKey = format(new Date(record.scrapedAt), 'dd/MM', { locale: ptBR });
          const existing = grouped.get(dateKey) || {
            date: dateKey,
            timestamp: new Date(record.scrapedAt).getTime(),
          };
          existing[record.store] = record.currentPrice;
          grouped.set(dateKey, existing);
        }

        setData(Array.from(grouped.values()).sort((a, b) => a.timestamp - b.timestamp));
      } catch {
        setData([]);
      }
      setLoading(false);
    }

    fetchHistory();
  }, [productId, days]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Carregando histórico...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Nenhum dado de preço disponível ainda.
      </div>
    );
  }

  const ALL_STORES: StoreName[] = ['amazon', 'mercadolivre', 'magazineluiza', 'kabum', 'casasbahia', 'ponto', 'fastshop', 'americanas', 'submarino'];

  const allPrices = data.flatMap((d) =>
    ALL_STORES
      .map((s) => d[s])
      .filter((v): v is number => v !== undefined)
  );
  const minPrice = Math.min(...allPrices, targetPrice) * 0.95;
  const maxPrice = Math.max(...allPrices, targetPrice) * 1.05;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {[7, 15, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 rounded text-sm ${
              days === d
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
          <YAxis
            stroke="#9CA3AF"
            fontSize={12}
            domain={[minPrice, maxPrice]}
            tickFormatter={(v) => `R$${v.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#F9FAFB' }}
            formatter={(value, name) => [
              `R$ ${Number(value).toFixed(2)}`,
              STORE_LABELS[name as StoreName] || String(name),
            ]}
          />
          <Legend
            formatter={(value: string) => STORE_LABELS[value as StoreName] || value}
          />

          {ALL_STORES.map(
            (store) => (
              <Line
                key={store}
                type="monotone"
                dataKey={store}
                stroke={STORE_COLORS[store]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            )
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
