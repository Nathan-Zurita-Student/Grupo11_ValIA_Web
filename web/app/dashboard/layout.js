'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import Nav from '@/components/Nav';

export default function DashboardLayout({ children }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  // Protege as rotas: sem usuário, volta para o login.
  useEffect(() => {
    if (ready && !user) router.replace('/');
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={28} />
      </div>
    );
  }

  return (
    <div className="bg-atmosphere min-h-screen">
      <Nav />
      <main className="mx-auto max-w-3xl px-5 py-8">{children}</main>
    </div>
  );
}
