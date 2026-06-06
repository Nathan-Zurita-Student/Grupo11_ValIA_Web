'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { PlusCircle, PackageOpen, Loader2, Search, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { productService } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { CATEGORIES, CATEGORY_LABELS, urgencyOf } from '@/lib/urgency';
import ProductCard from '@/components/ProductCard';

const URGENCY_FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'gone', label: 'Vencidos' },
  { key: 'red', label: 'Urgente' },
  { key: 'amber', label: 'Atenção' },
  { key: 'green', label: 'OK' },
];

export default function PantryPage() {
  const { pantryId } = useAuth();
  const { add: addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('todos');
  const [urgencyFilter, setUrgencyFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!pantryId) return;
    setLoading(true);
    try {
      const cat = category === 'todos' ? undefined : category;
      setProducts(await productService.list(pantryId, { category: cat }));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [pantryId, category]);

  useEffect(() => {
    load();
  }, [load]);

  // Filtragem client-side por busca e urgência (evita round-trip desnecessário)
  const visible = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (urgencyFilter !== 'todos') {
      list = list.filter((p) => urgencyOf(p.expiryDate).level === urgencyFilter);
    }
    return list;
  }, [products, search, urgencyFilter]);

  // Contagem de itens urgentes para o banner de alerta
  const urgentCount = useMemo(
    () => products.filter((p) => ['gone', 'red'].includes(urgencyOf(p.expiryDate).level)).length,
    [products]
  );

  async function handleResolve(product, action) {
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    try {
      await productService.resolve(pantryId, product.id, action);
      addToast(action === 'consumed' ? 'Marcado como consumido!' : 'Marcado como descartado.', action === 'consumed' ? 'success' : 'warning');
    } catch {
      load();
      addToast('Erro ao atualizar o produto.', 'error');
    }
  }

  async function handleDelete(product) {
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    try {
      await productService.remove(pantryId, product.id);
      addToast('Produto removido.', 'warning');
    } catch {
      load();
      addToast('Erro ao remover o produto.', 'error');
    }
  }

  async function handleEdit(product, data) {
    try {
      const updated = await productService.update(pantryId, product.id, data);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      addToast('Produto atualizado!');
    } catch {
      addToast('Erro ao atualizar o produto.', 'error');
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

      {/* Banner de alerta para itens urgentes */}
      {!loading && urgentCount > 0 && (
        <div className="animate-rise mb-4 flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
          <AlertTriangle size={16} className="shrink-0" />
          {urgentCount === 1
            ? '1 item vencido ou vencendo hoje!'
            : `${urgentCount} itens vencidos ou vencendo hoje!`}
        </div>
      )}

      {/* Barra de busca */}
      <div className="animate-rise delay-1 mb-4 relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produto..."
          className="w-full rounded-2xl border border-neutral-200 py-2.5 pl-9 pr-9 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filtro por categoria */}
      <div className="animate-rise delay-1 mb-3 flex flex-wrap gap-2">
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

      {/* Filtro por urgência */}
      <div className="animate-rise delay-2 mb-6 flex flex-wrap gap-2">
        {URGENCY_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setUrgencyFilter(key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              urgencyFilter === key
                ? urgencyFilterActive(key)
                : 'bg-white text-neutral-500 ring-1 ring-neutral-200 hover:ring-brand-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-brand-500" size={28} />
        </div>
      ) : visible.length === 0 ? (
        <div className="animate-rise rounded-3xl border border-dashed border-brand-200 bg-white/60 py-16 text-center">
          <PackageOpen className="mx-auto mb-3 text-brand-400" size={40} />
          <p className="font-medium text-ink">
            {search || urgencyFilter !== 'todos' || category !== 'todos'
              ? 'Nenhum produto encontrado'
              : 'Nenhum produto por aqui'}
          </p>
          <p className="mb-5 text-sm text-neutral-500">
            {search || urgencyFilter !== 'todos' || category !== 'todos'
              ? 'Tente outros filtros.'
              : 'Adicione o primeiro item da sua despensa.'}
          </p>
          {!search && urgencyFilter === 'todos' && category === 'todos' && (
            <Link
              href="/dashboard/add"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-4 py-2.5 font-medium text-white transition hover:bg-brand-600"
            >
              <PlusCircle size={18} /> Adicionar produto
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              index={i}
              onResolve={handleResolve}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function urgencyFilterActive(key) {
  const map = {
    todos: 'bg-brand-600 text-white',
    gone: 'bg-neutral-500 text-white',
    red: 'bg-red-500 text-white',
    amber: 'bg-amber-500 text-white',
    green: 'bg-brand-500 text-white',
  };
  return map[key] || 'bg-brand-600 text-white';
}
