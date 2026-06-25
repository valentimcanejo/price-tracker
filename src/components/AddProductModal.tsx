'use client';

import { useState } from 'react';
import { StoreName } from '@/types';

const STORES: { key: StoreName; label: string; placeholder: string }[] = [
  { key: 'amazon', label: 'Amazon', placeholder: 'https://www.amazon.com.br/dp/...' },
  { key: 'mercadolivre', label: 'Mercado Livre', placeholder: 'https://www.mercadolivre.com.br/...' },
  { key: 'magazineluiza', label: 'Magazine Luiza', placeholder: 'https://www.magazineluiza.com.br/...' },
  { key: 'kabum', label: 'KaBuM!', placeholder: 'https://www.kabum.com.br/produto/...' },
  { key: 'casasbahia', label: 'Casas Bahia', placeholder: 'https://www.casasbahia.com.br/...' },
  { key: 'ponto', label: 'Ponto', placeholder: 'https://www.pontofrio.com.br/...' },
  { key: 'fastshop', label: 'Fast Shop', placeholder: 'https://www.fastshop.com.br/...' },
  { key: 'americanas', label: 'Americanas', placeholder: 'https://www.americanas.com.br/...' },
  { key: 'submarino', label: 'Submarino', placeholder: 'https://www.submarino.com.br/...' },
];

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    targetPrice: number;
    stores: { store: StoreName; url: string; enabled: boolean }[];
  }) => void;
}

export default function AddProductModal({ open, onClose, onAdd }: AddProductModalProps) {
  const [name, setName] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [storeUrls, setStoreUrls] = useState<Record<StoreName, string>>({
    amazon: '',
    mercadolivre: '',
    magazineluiza: '',
    kabum: '',
    casasbahia: '',
    ponto: '',
    fastshop: '',
    americanas: '',
    submarino: '',
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const stores = STORES.filter((s) => storeUrls[s.key].trim()).map((s) => ({
      store: s.key,
      url: storeUrls[s.key].trim(),
      enabled: true,
    }));

    if (!name.trim() || !targetPrice || stores.length === 0) return;

    onAdd({
      name: name.trim(),
      targetPrice: parseFloat(targetPrice),
      stores,
    });

    setName('');
    setTargetPrice('');
    setStoreUrls({ amazon: '', mercadolivre: '', magazineluiza: '', kabum: '', casasbahia: '', ponto: '', fastshop: '', americanas: '', submarino: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Adicionar Produto</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl leading-none"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Nome do produto</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="PlayStation 5"
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Preço alvo (R$)
              </label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="3500.00"
                step="0.01"
                min="0"
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm text-gray-300">
                URLs das lojas (preencha ao menos uma)
              </label>
              {STORES.map((store) => (
                <div key={store.key}>
                  <label className="block text-xs text-gray-400 mb-1">{store.label}</label>
                  <input
                    type="url"
                    value={storeUrls[store.key]}
                    onChange={(e) =>
                      setStoreUrls((prev) => ({ ...prev, [store.key]: e.target.value }))
                    }
                    placeholder={store.placeholder}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
