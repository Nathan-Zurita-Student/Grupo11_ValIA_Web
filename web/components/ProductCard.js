'use client';

import { Check, Trash2 } from 'lucide-react';
import { urgencyOf, URGENCY_STYLES, CATEGORY_LABELS } from '@/lib/urgency';

export default function ProductCard({ product, onResolve, index = 0 }) {
  const u = urgencyOf(product.expiryDate);
  const s = URGENCY_STYLES[u.level];

  return (
    <div
      className={`animate-rise group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-soft ring-1 ${s.ring} transition hover:shadow-lift`}
      style={{ animationDelay: `${Math.min(index, 8) * 0.04}s` }}
    >
      <span className={`h-3 w-3 shrink-0 rounded-full ${s.dot}`} />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{product.name}</p>
        <p className="text-sm text-neutral-500">
          <span className={s.text}>{u.label}</span>
          {' · '}
          {product.quantity} un · {CATEGORY_LABELS[product.category] || product.category}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        <button
          onClick={() => onResolve(product, 'consumed')}
          title="Marcar como consumido"
          className="flex items-center gap-1 rounded-xl bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          <Check size={16} /> <span className="hidden sm:inline">Consumi</span>
        </button>
        <button
          onClick={() => onResolve(product, 'discarded')}
          title="Marcar como descartado"
          className="flex items-center gap-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50"
        >
          <Trash2 size={16} /> <span className="hidden sm:inline">Descartei</span>
        </button>
      </div>
    </div>
  );
}
