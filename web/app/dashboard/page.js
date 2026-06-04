'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PlusCircle, PackageOpen, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { productService } from '@/lib/api';
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/urgency';
import ProductCard from '@/components/ProductCard';

export default function PantryPage() {
  const { pantryId } = useAuth();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('todos');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!pantryId) return;
    setLoading(true);
    try {
      const cat = category === 'todos' ? undefined : category;
      setProducts(await productService.list(pantryId, cat));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [pantryId, category]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleResolve(product, action) {
    // Atualização otimista: remove da lista na hora.
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    try {
      await productService.resolve(pantryId, product.id, action);
    } catch {
      load();
    }
  }

  return (
    <div>
      <div className="animate-rise mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-600 tracking-tight text-ink">Sua despensa</h1>
          <p className="text-neutral-500">Ordenada pelo que vence primeiro.</p>
        </div>
        <Link
          href="/dashboard/add"
          className="hidden items-center gap-2 rounded-2xl bg-brand-500 px-4 py-2.5 font-medium text-white transition hover:bg-brand-600 sm:flex"
        >
          <PlusCircle size={18} /> Adicionar
        </Link>
      </div>

      <div className="animate-rise delay-1 mb-6 flex flex-wrap gap-2">
        {['todos', ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              category === c
                ? 'bg-brand-600 text-white'
                : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:ring-brand-200'
            }`}
          >
            {c === 'todos' ? 'Todos' : CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-brand-500" size={28} />
        </div>
      ) : products.length === 0 ? (
        <div className="animate-rise rounded-3xl border border-dashed border-brand-200 bg-white/60 py-16 text-center">
          <PackageOpen className="mx-auto mb-3 text-brand-400" size={40} />
          <p className="font-medium text-ink">Nenhum produto por aqui</p>
          <p className="mb-5 text-sm text-neutral-500">Adicione o primeiro item da sua despensa.</p>
          <Link
            href="/dashboard/add"
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-4 py-2.5 font-medium text-white transition hover:bg-brand-600"
          >
            <PlusCircle size={18} /> Adicionar produto
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} onResolve={handleResolve} />
          ))}
        </div>
      )}
    </div>
  );
}
