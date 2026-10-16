'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Rss, User, FileText, Settings, Radar, Menu, X, Newspaper } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, color: 'text-violet-500' },
  { href: '/articles', label: 'Articles', icon: Newspaper, color: 'text-sky-500' },
  { href: '/sources', label: 'Sources', icon: Rss, color: 'text-orange-500' },
  { href: '/profil', label: 'Profil', icon: User, color: 'text-pink-500' },
  { href: '/logs', label: 'Journal', icon: FileText, color: 'text-emerald-500' },
  { href: '/settings', label: 'Paramètres', icon: Settings, color: 'text-slate-500' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card border border-border"
        style={{ boxShadow: 'var(--shadow-sm)' }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 flex flex-col border-r transition-transform duration-300',
          'bg-[hsl(var(--sidebar-bg))] border-[hsl(var(--sidebar-border))]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[hsl(var(--sidebar-border))]">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 text-white shadow-md">
            <Radar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-sm tracking-tight">Pixel & Co</h1>
            <p className="text-xs text-muted-foreground">Veille Tech</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className={cn('h-4 w-4', active ? 'text-white' : item.color)} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[hsl(var(--sidebar-border))] flex items-center justify-between">
          <ThemeToggle />
          <span className="text-xs text-muted-foreground">v1.0</span>
        </div>
      </aside>
    </>
  );
}
