'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { user, ready, signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Se já está logado, vai direto pra despensa.
  useEffect(() => {
    if (ready && user) router.replace('/dashboard');
  }, [ready, user, router]);

  function update(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') await signUp(form);
      else await signIn({ email: form.email, password: form.password });
      router.replace('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível continuar. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-atmosphere flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="animate-rise mb-8 text-center">
          <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lift">
            <Leaf size={28} />
          </span>
          <h1 className="font-display text-4xl font-600 tracking-tight text-brand-700">ValIA</h1>
          <p className="mt-1 text-neutral-500">Gestão de validade inteligente</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="animate-rise delay-1 space-y-4 rounded-3xl bg-white/80 p-7 shadow-soft ring-1 ring-brand-100 backdrop-blur"
        >
          <div className="flex rounded-2xl bg-brand-50 p-1">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
                  mode === m ? 'bg-white text-brand-700 shadow-soft' : 'text-neutral-500'
                }`}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          {mode === 'register' && (
            <Field label="Nome" value={form.name} onChange={(v) => update('name', v)} placeholder="Seu nome" />
          )}
          <Field label="E-mail" type="email" value={form.email} onChange={(v) => update('email', v)} placeholder="voce@email.com" />
          <Field label="Senha" type="password" value={form.password} onChange={(v) => update('password', v)} placeholder="Mínimo 6 caracteres" />

          {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3.5 font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {mode === 'login' ? 'Entrar' : 'Criar minha conta'}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-neutral-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-ink outline-none transition placeholder:text-neutral-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}
