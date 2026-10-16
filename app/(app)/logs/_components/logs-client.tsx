'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Filter, Loader2, AlertTriangle, Rss, Brain, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layouts/page-header';
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate';
import { ClientOnly } from '@/components/client-only';

interface LogEntry {
  id: string;
  type: string;
  message: string;
  metadata: any;
  createdAt: string;
}

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  fetch: { icon: Rss, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', label: 'Collecte' },
  score: { icon: Brain, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', label: 'Scoring' },
  digest: { icon: BookOpen, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', label: 'Digest' },
  error: { icon: AlertTriangle, color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', label: 'Erreur' },
};

const filters = [
  { value: '', label: 'Tous' },
  { value: 'fetch', label: 'Collecte' },
  { value: 'score', label: 'Scoring' },
  { value: 'digest', label: 'Digest' },
  { value: 'error', label: 'Erreurs' },
];

export function LogsClient() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (typeFilter) params.set('type', typeFilter);
      const res = await fetch(`/api/logs?${params.toString()}`);
      const data = await res.json();
      setLogs(data?.logs ?? []);
      setTotalPages(data?.totalPages ?? 1);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      <PageHeader
        title="Journal système"
        description="Historique des opérations et erreurs"
      />

      <FadeIn>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={typeFilter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setTypeFilter(f.value); setPage(1); }}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </FadeIn>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (logs ?? []).length === 0 ? (
        <FadeIn>
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Aucun log trouvé.</p>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <Stagger className="space-y-2">
          {(logs ?? []).map((log: LogEntry) => {
            const config = typeConfig[log.type] ?? typeConfig.error;
            const Icon = config.icon;
            return (
              <StaggerItem key={log.id}>
                <Card>
                  <CardContent className="p-3 flex items-start gap-3">
                    <Badge className={`${config.color} shrink-0 mt-0.5`}>
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{log.message}</p>
                      <ClientOnly>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.createdAt).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}
                        </p>
                      </ClientOnly>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
