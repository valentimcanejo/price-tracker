'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardProduct, StoreName } from '@/types';
import ProductCard from '@/components/ProductCard';
import AddProductModal from '@/components/AddProductModal';

export default function Dashboard() {
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
    } catch {
      console.error('Failed to fetch products');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddProduct = async (data: {
    name: string;
    targetPrice: number;
    stores: { store: StoreName; url: string; enabled: boolean }[];
  }) => {
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      fetchProducts();
    } catch {
      console.error('Failed to add product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este produto?')) return;
    try {
      await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch {
      console.error('Failed to delete product');
    }
  };

  const handleUpdateTarget = async (id: string, newTarget: number) => {
    try {
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, targetPrice: newTarget }),
      });
      fetchProducts();
    } catch {
      console.error('Failed to update target');
    }
  };

  const handleScrapeNow = async () => {
    setScraping(true);
    try {
      await fetch('/api/scrape', { method: 'POST' });
      await fetchProducts();
    } catch {
      console.error('Scrape failed');
    }
    setScraping(false);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Price Tracker
        </h1>
        <p className="text-gray-400">
          Monitoramento de precos em lojas brasileiras
        </p>
      </header>

      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium"
        >
          + Adicionar Produto
        </button>
        <button
          onClick={handleScrapeNow}
          disabled={scraping}
          className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-lg font-medium"
        >
          {scraping ? 'Coletando precos...' : 'Coletar precos agora'}
        </button>
        <button
          onClick={fetchProducts}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg"
        >
          Atualizar
        </button>
        {lastUpdate && (
          <span className="text-gray-500 text-sm ml-auto">
            Atualizado: {lastUpdate}
          </span>
        )}
      </div>

      {/* Product list */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Carregando...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-500 text-lg mb-4">
            Nenhum produto monitorado
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium"
          >
            Adicionar seu primeiro produto
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onDelete={handleDelete}
              onUpdateTarget={handleUpdateTarget}
            />
          ))}
        </div>
      )}

      <AddProductModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddProduct}
      />
    </main>
  );
}
