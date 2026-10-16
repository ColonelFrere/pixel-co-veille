'use client';

import { useState, useEffect, useCallback } from 'react';
import { Key, CheckCircle2, XCircle, Loader2, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layouts/page-header';
import { FadeIn } from '@/components/ui/animate';
import { ClientOnly } from '@/components/client-only';

interface SettingsData {
  groqConfigured: boolean;
  geminiConfigured: boolean;
  lastRun: string | null;
  lastRunType: string | null;
  todayArticles: number;
  todayErrors: number;
}

export function SettingsClient() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const d = await res.json();
      setData(d);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      <PageHeader
        title="Paramètres"
        description="Configuration et état du système de veille"
      />

      <FadeIn>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4 w-4" /> Clés API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Groq API</p>
                  <p className="text-xs text-muted-foreground">Moteur de scoring principal</p>
                </div>
                {data?.groqConfigured ? (
                  <Badge variant="outline" className="gap-1 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700">
                    <CheckCircle2 className="h-3 w-3" /> Configurée
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" /> Manquante
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Gemini API</p>
                  <p className="text-xs text-muted-foreground">Moteur de scoring fallback</p>
                </div>
                {data?.geminiConfigured ? (
                  <Badge variant="outline" className="gap-1 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700">
                    <CheckCircle2 className="h-3 w-3" /> Configurée
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" /> Manquante
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" /> Dernier run
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Date</span>
                <ClientOnly>
                  <span className="text-sm font-mono">
                    {data?.lastRun
                      ? new Date(data.lastRun).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
                      : 'Aucun'}
                  </span>
                </ClientOnly>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className="text-sm font-mono">{data?.lastRunType ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Articles du jour</span>
                <span className="text-sm font-mono">{data?.todayArticles ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Erreurs du jour</span>
                <span className="text-sm font-mono text-destructive">{data?.todayErrors ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>
    </div>
  );
}
