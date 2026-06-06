'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, ScanLine, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { productService } from '@/lib/api';
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/urgency';
import CameraCapture from '@/components/CameraCapture';

export default function AddProductPage() {
  const router = useRouter();
  const { pantryId } = useAuth();
  const [form, setForm] = useState({ name: '', expiryDate: '', quantity: '1', category: 'outros' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [dateSource, setDateSource] = useState(null); // 'ocr' | null

  function update(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function handleDateDetected(isoDate) {
    update('expiryDate', isoDate);
    setDateSource('ocr');
  }

  function handleDateChange(e) {
    update('expiryDate', e.target.value);
    setDateSource(null);
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

  // Formata AAAA-MM-DD → DD/MM/AAAA para exibir no badge
  function fmtDate(iso) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  return (
    <>
      {cameraOpen && (
        <CameraCapture
          onDateDetected={handleDateDetected}
          onClose={() => setCameraOpen(false)}
        />
      )}

      <div className="mx-auto max-w-lg">
        <h1 className="animate-rise mb-1 font-display text-3xl font-600 tracking-tight text-ink">Novo produto</h1>
        <p className="animate-rise delay-1 mb-6 text-neutral-500">Digite os dados ou leia a validade pela câmera.</p>

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

            {/* Botão de câmera em destaque */}
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50 py-4 font-medium text-brand-700 transition hover:border-brand-400 hover:bg-brand-100"
            >
              <Camera size={20} />
              Abrir câmera e ler validade
            </button>

            {/* Badge de confirmação quando OCR encontrou data */}
            {dateSource === 'ocr' && form.expiryDate && (
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm text-brand-700 ring-1 ring-brand-200">
                <Check size={15} className="shrink-0 text-brand-500" />
                <span>Data lida pela câmera: <strong>{fmtDate(form.expiryDate)}</strong></span>
                <button
                  type="button"
                  onClick={() => { update('expiryDate', ''); setDateSource(null); }}
                  className="ml-auto text-brand-400 hover:text-brand-600"
                >
                  Limpar
                </button>
              </div>
            )}

            {/* Input manual (sempre disponível) */}
            <div>
              <span className="mb-1 block text-xs text-neutral-400">ou digite manualmente</span>
              <input
                type="date"
                value={form.expiryDate}
                onChange={handleDateChange}
                required
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
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
    </>
  );
}
