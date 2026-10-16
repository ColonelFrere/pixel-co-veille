import { TrendingUp, Shield, Package, Sparkles } from 'lucide-react';

export const catConfig: Record<string, { label: string; icon: any; badge: string; gradient: string; soft: string }> = {
  tendances: {
    label: 'Tendances',
    icon: TrendingUp,
    badge: 'bg-sky-500 text-white',
    gradient: 'from-sky-500 to-blue-600',
    soft: 'bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-800',
  },
  'sécurité': {
    label: 'Sécurité',
    icon: Shield,
    badge: 'bg-rose-500 text-white',
    gradient: 'from-rose-500 to-red-600',
    soft: 'bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800',
  },
  versions: {
    label: 'Versions',
    icon: Package,
    badge: 'bg-emerald-500 text-white',
    gradient: 'from-emerald-500 to-green-600',
    soft: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800',
  },
  surprise: {
    label: 'Article surprise 🎲',
    icon: Sparkles,
    badge: 'bg-amber-500 text-white',
    gradient: 'from-amber-400 to-orange-500',
    soft: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800',
  },
};

export function scoreColor(score: number | null | undefined): string {
  const s = score ?? 0;
  if (s >= 8) return 'bg-gradient-to-br from-emerald-400 to-green-600 text-white';
  if (s >= 6) return 'bg-gradient-to-br from-violet-400 to-purple-600 text-white';
  if (s >= 4) return 'bg-gradient-to-br from-amber-300 to-orange-500 text-white';
  return 'bg-gradient-to-br from-slate-300 to-slate-500 text-white';
}
