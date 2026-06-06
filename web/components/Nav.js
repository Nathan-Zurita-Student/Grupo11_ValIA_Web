'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, PlusCircle, BarChart3, LogOut, Leaf } from 'lucide-react';
import { useAuth } from '@/lib/auth';

function initials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const LINKS = [
  { href: '/dashboard', label: 'Despensa', icon: LayoutGrid },
  { href: '/dashboard/add', label: 'Adicionar', icon: PlusCircle },
  { href: '/dashboard/report', label: 'Relatório', icon: BarChart3 },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  function handleLogout() {
    signOut();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-10 border-b border-brand-100/60 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Leaf size={18} />
          </span>
          <span className="font-display text-xl font-600 tracking-tight text-brand-700">ValIA</span>
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active ? 'bg-brand-500 text-white' : 'text-neutral-600 hover:bg-brand-50'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          {user?.name && (
            <span
              title={user.name}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-xl bg-brand-100 text-xs font-semibold text-brand-700 select-none"
            >
              {initials(user.name)}
            </span>
          )}
          <button
            onClick={handleLogout}
            title="Sair"
            className="ml-1 flex items-center rounded-xl px-2.5 py-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
          >
            <LogOut size={16} />
          </button>
        </nav>
      </div>
    </header>
  );
}
