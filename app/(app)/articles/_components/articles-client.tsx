'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Loader2, Rss, Newspaper } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layouts/page-header';
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate';
import { catConfig, scoreColor } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface Article {
  id: string;
  title: string;
  url: string;
  description: string;
  score: number | null;
  categorie: string | null;
  publishedAt: string | null;
  isSurprise: boolean;
  source: string;
}

const filters = [
  { value: '', label: 'Toutes' },
  { value: 'tendances', label: 'Tendances' },
  { value: 'sécurité', label: 'Sécurité' },
  { value: 'versions', label: 'Versions' },
];

export function ArticlesClient() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [sources, setSources] = useState<{ id: string; name: string }[]>([]);
  const [categorie, setCategorie] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (categorie) params.set('categorie', categorie);
      if (source) params.set('source', source);
      const res = await fetch(`/api/articles?${params.toString()}`);
      const data = await res.json();
      setArticles(data?.articles ?? []);
      setSources(data?.sources ?? []);
      setTotalPages(data?.totalPages ?? 1);
      setTotal(data?.total ?? 0);
    } catch (err) {
      console.error('Erreur chargement articles :', err);
    } finally {
      setLoading(false);
    }
  }, [page, categorie, source]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      <PageHeader title="Articles" description={`${total} articles notés par l'IA, avec leur source`} />

      <FadeIn>
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => {
            const conf = f.value ? catConfig[f.value] : null;
            const active = categorie === f.value;
            return (
              <button
                key={f.value || 'all'}
                onClick={() => { setCategorie(f.value); setPage(1); }}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                  active
                    ? conf ? `bg-gradient-to-r ${conf.gradient} text-white shadow-md` : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md'
                    : 'bg-card text-muted-foreground hover:text-foreground shadow-sm'
                )}
              >
                {f.label}
              </button>
            );
          })}
          <select
            value={source}
            onChange={(e) => { setSource(e.target.value); setPage(1); }}
            className="ml-auto h-9 rounded-full border bg-card px-4 text-sm"
            aria-label="Filtrer par source"
          >
            <option value="">Toutes les sources</option>
            {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </FadeIn>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : articles.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-40" />
          Aucun article noté pour ce filtre. Lancez la veille depuis le tableau de bord.
        </CardContent></Card>
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2">
          {articles.map((a) => {
            const conf = catConfig[a.categorie ?? 'tendances'] ?? catConfig.tendances;
            const Icon = conf.icon;
            return (
              <StaggerItem key={a.id}>
                <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                  <div className={`h-1.5 bg-gradient-to-r ${conf.gradient}`} />
                  <CardContent className="p-5 flex gap-4">
                    <div className={cn('shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold shadow', scoreColor(a.score))}>
                      <span className="text-lg leading-none">{a.score}</span>
                      <span className="text-[10px] opacity-90">/10</span>
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${conf.badge}`}>
                          <Icon className="h-3 w-3" />{conf.label}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200">
                          <Rss className="h-3 w-3" />{a.source}
                        </span>
                        {a.isSurprise && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-400 text-white">Surprise 🎲</span>
                        )}
                      </div>
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="font-semibold leading-snug hover:text-primary transition-colors inline-flex gap-1">
                        {a.title}
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-1 opacity-60" />
                      </a>
                      {a.description && <p className="text-sm text-muted-foreground line-clamp-2">{a.description}</p>}
                      {a.publishedAt && (
                        <p className="text-xs text-muted-foreground">
                          Publié le {new Date(a.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</Button>
          <span className="text-sm text-muted-foreground">Page {page} sur {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Suivant</Button>
        </div>
      )}
    </div>
  );
}
