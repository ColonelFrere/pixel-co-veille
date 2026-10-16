'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Play, Sparkles, ExternalLink, Loader2, Newspaper, Rss, Star, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layouts/page-header';
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate';
import { catConfig, scoreColor } from '@/lib/categories';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface KPI {
  metric: string;
  label: string;
  value: number;
  format: string;
  delta: number;
  delta_label: string;
  good_when: string;
}

interface DigestArticle {
  id: string;
  title: string;
  url: string;
  score: number;
  source: string;
  description: string;
  categorie?: string;
}

interface Digest {
  id: string;
  date: string;
  content: Record<string, DigestArticle[]>;
  articleCount: number;
}

const kpiStyle: Record<string, { icon: any; gradient: string }> = {
  articles_total: { icon: Newspaper, gradient: 'from-violet-500 to-fuchsia-500' },
  sources_actives: { icon: Rss, gradient: 'from-orange-400 to-pink-500' },
  score_moyen: { icon: Star, gradient: 'from-sky-400 to-blue-600' },
  erreurs: { icon: AlertTriangle, gradient: 'from-rose-400 to-red-600' },
};

const catOrder = ['sécurité', 'versions', 'tendances', 'surprise'];

export function DashboardClient() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, digestRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/digests?limit=5'),
      ]);
      const dashData = await dashRes.json();
      const digestData = await digestRes.json();
      setKpis(dashData?.data?.kpis ?? []);
      setDigests(digestData?.digests ?? []);
    } catch (err: any) {
      console.error('Erreur chargement tableau de bord :', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runPipeline = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/run-pipeline', { method: 'POST' });
      const data = await res.json();
      toast.success(`Veille terminée : ${data?.pipeline?.fetch?.newArticles ?? 0} nouveaux articles, ${data?.pipeline?.score?.scored ?? 0} notés`);
      await fetchData();
    } catch (err: any) {
      toast.error('Erreur pendant la veille : ' + (err?.message ?? 'erreur inconnue'));
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-8">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de la veille technologique de Pixel & Co"
        actions={
          <Button onClick={runPipeline} disabled={running} className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:opacity-90 text-white shadow-md">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? 'Veille en cours...' : 'Lancer la veille'}
          </Button>
        }
      />

      <FadeIn>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(kpis ?? []).map((kpi: KPI) => {
            const style = kpiStyle[kpi.metric] ?? kpiStyle.articles_total;
            const Icon = style.icon;
            return (
              <div key={kpi.metric} className={`rounded-2xl p-4 text-white shadow-lg bg-gradient-to-br ${style.gradient}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-white/90">{kpi.label}</p>
                  <Icon className="h-4 w-4 text-white/90" />
                </div>
                <p className="text-3xl font-display font-bold tracking-tight mt-2">{kpi.value}</p>
                {kpi.delta_label ? (
                  <p className="text-xs text-white/85 mt-1">
                    {kpi.delta > 0 ? '+' : ''}{kpi.delta} {kpi.delta_label}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl tracking-tight">Derniers digests</h2>
          <Link href="/articles" className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:underline">
            Voir tous les articles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </FadeIn>

      {(digests ?? []).length === 0 ? (
        <FadeIn delay={0.2}>
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Aucun digest pour l&apos;instant.</p>
              <p className="text-sm mt-1">Lancez la veille pour générer votre premier digest.</p>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <Stagger className="space-y-6">
          {(digests ?? []).map((digest: Digest) => {
            const entries = Object.entries(digest.content ?? {}).sort(
              ([a], [b]) => catOrder.indexOf(a) - catOrder.indexOf(b)
            );
            return (
              <StaggerItem key={digest.id}>
                <Card className="overflow-hidden shadow-md">
                  <div className="h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400" />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-display">
                        Digest du {new Date(digest.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })}
                      </CardTitle>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200">
                        {digest.articleCount} articles
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {entries.map(([cat, articles]: [string, any]) => {
                      const config = catConfig[cat] ?? catConfig.tendances;
                      const Icon = config.icon;
                      return (
                        <div key={cat} className={cn('rounded-xl border p-4', config.soft)}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br ${config.gradient} text-white`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="font-semibold text-sm">{config.label}</span>
                          </div>
                          <div className="space-y-3">
                            {(articles ?? []).map((article: DigestArticle) => (
                              <div key={article.id ?? article.url} className="flex items-start gap-3">
                                <span className={cn('shrink-0 text-xs font-bold px-2 py-1 rounded-lg shadow-sm', scoreColor(article.score))}>
                                  {article.score}/10
                                </span>
                                <div className="min-w-0 flex-1">
                                  <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium leading-snug hover:text-primary transition-colors inline-flex gap-1"
                                  >
                                    <span className="line-clamp-2">{article.title}</span>
                                    <ExternalLink className="h-3 w-3 shrink-0 mt-1 opacity-60" />
                                  </a>
                                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                    <Rss className="h-3 w-3" /> Source : {article.source}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}
