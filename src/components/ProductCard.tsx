'use client';

import { useState } from 'react';
import { DashboardProduct, StoreName } from '@/types';
import PriceChart from './PriceChart';

function getCouponPrice(price: number, coupon?: string): number | null {
  if (!coupon) return null;
  const match = coupon.match(/(\d+)\s*%/);
  if (!match) return null;
  const pct = parseInt(match[1], 10);
  return Math.round(price * (1 - pct / 100) * 100) / 100;
}

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

const STORE_COLORS: Record<StoreName, string> = {
  amazon: 'bg-yellow-500',
  mercadolivre: 'bg-yellow-300',
  magazineluiza: 'bg-blue-500',
  kabum: 'bg-orange-500',
  casasbahia: 'bg-red-600',
  ponto: 'bg-purple-600',
  fastshop: 'bg-green-500',
  americanas: 'bg-red-500',
  submarino: 'bg-cyan-600',
};

interface ProductCardProps {
  product: DashboardProduct;
  onDelete: (id: string) => void;
  onUpdateTarget: (id: string, newTarget: number) => void;
}

export default function ProductCard({ product, onDelete, onUpdateTarget }: ProductCardProps) {
  const [showChart, setShowChart] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetValue, setTargetValue] = useState(product.targetPrice.toString());

  const handleSaveTarget = () => {
    const val = parseFloat(targetValue);
    if (!isNaN(val) && val > 0) {
      onUpdateTarget(product.id, val);
      setEditingTarget(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-white">{product.name}</h3>
          <div className="flex items-center gap-3 mt-1">
            {editingTarget ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Meta: R$</span>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-24 bg-gray-700 text-white px-2 py-1 rounded text-sm"
                  step="0.01"
                />
                <button
                  onClick={handleSaveTarget}
                  className="text-green-400 hover:text-green-300 text-sm"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setEditingTarget(false)}
                  className="text-gray-400 hover:text-gray-300 text-sm"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingTarget(true)}
                className="text-sm text-gray-400 hover:text-white"
              >
                Meta: R$ {product.targetPrice.toFixed(2)} (editar)
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowChart(!showChart)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm"
          >
            {showChart ? 'Ocultar gráfico' : 'Ver gráfico'}
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-300 rounded text-sm"
          >
            Remover
          </button>
        </div>
      </div>

      {/* Best price highlight */}
      {product.lowestPrice && product.lowestStore && (
        <div className="bg-green-900/30 border border-green-800 rounded-lg p-3">
          <div className="text-green-400 text-sm font-medium">Menor preço atual</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-300">
              R$ {product.lowestPrice.toFixed(2)}
            </span>
            <span className="text-green-500 text-sm">
              {STORE_LABELS[product.lowestStore]}
            </span>
          </div>
          {product.historicalLow && product.lowestPrice <= product.historicalLow && (
            <div className="text-yellow-400 text-xs mt-1 font-medium">
              Menor preço histórico!
            </div>
          )}
          {product.historicalLow && product.lowestPrice > product.historicalLow && (
            <div className="text-gray-400 text-xs mt-1">
              Histórico: R$ {product.historicalLow.toFixed(2)}
            </div>
          )}
        </div>
      )}

      {/* Store prices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {product.stores
          .filter((s) => s.enabled)
          .map((storeConfig) => {
            const priceData = product.latestPrices[storeConfig.store];
            const isOutOfStock = priceData && !priceData.available;
            return (
              <div
                key={storeConfig.store}
                className={`bg-gray-900 rounded-lg p-3 border ${
                  isOutOfStock ? 'border-red-800/60 opacity-70' : 'border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${STORE_COLORS[storeConfig.store]}`} />
                    <span className="text-gray-300 text-sm font-medium">
                      {STORE_LABELS[storeConfig.store]}
                    </span>
                  </div>
                  {isOutOfStock && (
                    <span className="px-2 py-0.5 bg-red-900/60 text-red-300 text-xs rounded-full font-medium">
                      Esgotado
                    </span>
                  )}
                </div>
                {priceData ? (
                  (() => {
                    const couponPrice = getCouponPrice(priceData.currentPrice, priceData.coupon);
                    return (
                      <div>
                        {couponPrice ? (
                          <>
                            <div className={`text-sm ${isOutOfStock ? 'text-gray-600' : 'text-gray-400'} line-through`}>
                              R$ {priceData.currentPrice.toFixed(2)}
                            </div>
                            <div className={`font-bold text-lg ${isOutOfStock ? 'text-gray-500 line-through' : 'text-green-300'}`}>
                              R$ {couponPrice.toFixed(2)}
                            </div>
                            <div className="text-yellow-400 text-xs mt-1 font-medium">
                              {priceData.coupon}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={`font-bold text-lg ${isOutOfStock ? 'text-gray-500 line-through' : 'text-white'}`}>
                              R$ {priceData.currentPrice.toFixed(2)}
                            </div>
                            {priceData.coupon && (
                              <div className="text-yellow-400 text-xs mt-1">{priceData.coupon}</div>
                            )}
                          </>
                        )}
                        {priceData.originalPrice && (
                          <div className="text-gray-500 text-sm line-through">
                            R$ {priceData.originalPrice.toFixed(2)}
                          </div>
                        )}
                        {priceData.discount && (
                          <span className="text-green-400 text-xs">{priceData.discount}</span>
                        )}
                        <a
                          href={storeConfig.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs mt-1 block"
                        >
                          Ver na loja
                        </a>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-gray-500 text-sm">Sem dados ainda</div>
                )}
              </div>
            );
          })}
      </div>

      {/* Chart */}
      {showChart && (
        <div className="border-t border-gray-700 pt-4">
          <PriceChart productId={product.id} targetPrice={product.targetPrice} />
        </div>
      )}
    </div>
  );
}
