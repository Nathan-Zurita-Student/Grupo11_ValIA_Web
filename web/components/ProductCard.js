'use client';

import { useState } from 'react';
import { Check, Trash2, Pencil, X, Save, Loader2 } from 'lucide-react';
import { urgencyOf, URGENCY_STYLES, CATEGORY_LABELS, CATEGORIES } from '@/lib/urgency';

export default function ProductCard({ product, onResolve, onDelete, onEdit, index = 0 }) {
  const u = urgencyOf(product.expiryDate);
  const s = URGENCY_STYLES[u.level];
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: product.name,
    expiryDate: product.expiryDate,
    quantity: String(product.quantity),
    category: product.category,
  });

  function upd(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      await onEdit(product, {
        name: form.name,
        expiryDate: form.expiryDate,
        quantity: Number(form.quantity),
        category: form.category,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setForm({
      name: product.name,
      expiryDate: product.expiryDate,
      quantity: String(product.quantity),
      category: product.category,
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <div
        className={`animate-rise rounded-2xl bg-white p-4 shadow-soft ring-1 ${s.ring}`}
        style={{ animationDelay: `${Math.min(index, 8) * 0.04}s` }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-500">Editando produto</span>
          <button onClick={cancel} className="text-neutral-400 hover:text-neutral-600">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          <input
            value={form.name}
            onChange={(e) => upd('name', e.target.value)}
            placeholder="Nome do produto"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => upd('expiryDate', e.target.value)}
              className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => upd('quantity', e.target.value)}
              className="w-20 rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => upd('category', c)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  form.category === c
                    ? 'bg-brand-600 text-white'
                    : 'bg-neutral-50 text-neutral-600 ring-1 ring-neutral-200 hover:ring-brand-200'
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={cancel}
              className="flex-1 rounded-xl border border-neutral-200 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <button
          onClick={() => setEditing(true)}
          title="Editar produto"
          className="rounded-xl border border-neutral-200 px-2.5 py-2 text-neutral-400 transition hover:border-brand-200 hover:text-brand-600"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => onDelete(product)}
          title="Remover produto"
          className="rounded-xl border border-neutral-200 px-2.5 py-2 text-neutral-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
