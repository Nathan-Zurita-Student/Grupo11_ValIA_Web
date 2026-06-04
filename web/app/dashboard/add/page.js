'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, ScanLine } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { productService } from '@/lib/api';
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/urgency';

// Extrai uma data AAAA-MM-DD a partir de texto reconhecido (formatos comuns de embalagem).
function extractDate(text) {
  const m = text.match(/(\d{2})[\/.\- ](\d{2})[\/.\- ](\d{2,4})/);
  if (!m) return null;
  let [, dd, mm, yyyy] = m;
  if (yyyy.length === 2) yyyy = `20${yyyy}`;
  if (Number(mm) > 12) return null;
  return `${yyyy}-${mm}-${dd}`;
}

export default function AddProductPage() {
  const router = useRouter();
  const { pantryId } = useAuth();
  const [form, setForm] = useState({ name: '', expiryDate: '', quantity: '1', category: 'outros' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ocr, setOcr] = useState({ running: false, msg: '' });

  function update(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  // OCR no navegador: o usuário envia uma foto da embalagem e o Tesseract.js
  // tenta ler a data de validade, preenchendo o campo automaticamente.
  async function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcr({ running: true, msg: 'Lendo a imagem...' });
    setError('');
    try {
      const Tesseract = (await import('tesseract.js')).default;
      const { data } = await Tesseract.recognize(file, 'por');
      const date = extractDate(data.text || '');
      if (date) {
        update('expiryDate', date);
        setOcr({ running: false, msg: 'Data detectada!' });
      } else {
        setOcr({ running: false, msg: 'Não consegui ler a data. Digite manualmente.' });
      }
    } catch {
      setOcr({ running: false, msg: 'Falha ao processar a imagem.' });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await productService.create(pantryId, {
        name: form.name,
        expiryDate: form.expiryDate,
        quantity: Number(form.quantity),
        category: form.category,
      });
      router.push('/dashboard');
    } catch (err) {
      const details = err.response?.data?.details;
      setError(details ? details.map((d) => d.mensagem).join(' · ') : 'Não foi possível salvar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="animate-rise mb-1 font-display text-3xl font-600 tracking-tight text-ink">Novo produto</h1>
      <p className="animate-rise delay-1 mb-6 text-neutral-500">Digite os dados ou leia a validade por foto.</p>

      <form onSubmit={handleSubmit} className="animate-rise delay-2 space-y-5 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-brand-100">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-600">Nome do produto</span>
          <input
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Ex: Leite integral"
            required
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-neutral-600">Data de validade</span>
          <div className="flex gap-2">
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => update('expiryDate', e.target.value)}
              required
              className="flex-1 rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 font-medium text-white transition hover:bg-brand-700">
              {ocr.running ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              <span className="hidden sm:inline">Ler foto</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleImage} className="hidden" />
            </label>
          </div>
          {ocr.msg && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-brand-600">
              <ScanLine size={14} /> {ocr.msg}
            </p>
          )}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-600">Quantidade</span>
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => update('quantity', e.target.value)}
            required
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-neutral-600">Categoria</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => update('category', c)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  form.category === c
                    ? 'bg-brand-600 text-white'
                    : 'bg-neutral-50 text-neutral-600 ring-1 ring-neutral-200 hover:ring-brand-200'
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="flex-1 rounded-2xl border border-neutral-200 py-3 font-medium text-neutral-600 transition hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3 font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            {loading && <Loader2 size={18} className="animate-spin" />} Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
