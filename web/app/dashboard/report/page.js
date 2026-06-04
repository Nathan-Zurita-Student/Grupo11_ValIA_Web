'use client';

import { useEffect, useState } from 'react';
import { Loader2, TrendingDown, Recycle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { productService } from '@/lib/api';

export default function ReportPage() {
  const { pantryId } = useAuth();
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (pantryId) productService.report(pantryId).then(setReport).catch(() => {});
  }, [pantryId]);

  if (!report) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-brand-500" size={28} />
      </div>
    );
  }

  const empty = report.total === 0;

  return (
    <div>
      <h1 className="animate-rise mb-1 font-display text-3xl font-600 tracking-tight text-ink">Relatório de desperdício</h1>
      <p className="animate-rise delay-1 mb-6 text-neutral-500">Consumir mais do que descartar é o objetivo.</p>

      {empty ? (
        <div className="animate-rise rounded-3xl border border-dashed border-brand-200 bg-white/60 py-16 text-center text-neutral-500">
          Ainda não há itens resolvidos. Marque produtos como consumidos ou descartados para ver suas métricas.
        </div>
      ) : (
        <>
          <div className="animate-rise delay-2 grid grid-cols-2 gap-4">
            <Stat icon={Recycle} label="Consumidos" value={`${report.consumedRate}%`} sub={`${report.consumed} itens`} tone="brand" />
            <Stat icon={TrendingDown} label="Descartados" value={`${report.discardedRate}%`} sub={`${report.discarded} itens`} tone="red" />
          </div>

          <div className="animate-rise delay-3 mt-6 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-brand-100">
            <div className="mb-2 flex justify-between text-sm font-medium text-neutral-500">
              <span>Proporção</span>
              <span>{report.total} itens no total</span>
            </div>
            <div className="flex h-4 overflow-hidden rounded-full bg-neutral-100">
              <div className="bg-brand-500 transition-all" style={{ width: `${report.consumedRate}%` }} />
              <div className="bg-urgency-red transition-all" style={{ width: `${report.discardedRate}%` }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, tone }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    red: 'bg-red-50 text-red-500',
  };
  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-brand-100">
      <span className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon size={20} />
      </span>
      <p className="font-display text-4xl font-600 text-ink">{value}</p>
      <p className="text-sm font-medium text-neutral-600">{label}</p>
      <p className="text-sm text-neutral-400">{sub}</p>
    </div>
  );
}
