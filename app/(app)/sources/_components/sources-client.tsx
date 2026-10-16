'use client';

import { useState, useEffect, useCallback } from 'react';
import { Rss, Plus, Trash2, Power, PowerOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layouts/page-header';
import { FadeIn, Stagger, StaggerItem, HoverLift } from '@/components/ui/animate';
import { toast } from 'sonner';

interface Source {
  id: string;
  name: string;
  url: string;
  categorie: string;
  active: boolean;
  lastError: string | null;
  createdAt: string;
}

const catColors: Record<string, string> = {
  tendances: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'sécurité': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  versions: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

export function SourcesClient() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', url: '', categorie: 'tendances' });
  const [submitting, setSubmitting] = useState(false);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch('/api/sources');
      const data = await res.json();
      setSources(data?.sources ?? []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  const addSource = async () => {
    if (!formData.name || !formData.url) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        toast.error(errData?.error ?? 'Erreur');
        return;
      }
      toast.success('Source ajoutée');
      setFormData({ name: '', url: '', categorie: 'tendances' });
      setShowForm(false);
      await fetchSources();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSource = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      });
      await fetchSources();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur');
    }
  };

  const deleteSource = async (id: string) => {
    if (!confirm('Supprimer cette source ?')) return;
    try {
      await fetch(`/api/sources/${id}`, { method: 'DELETE' });
      toast.success('Source supprimée');
      await fetchSources();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur');
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
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      <PageHeader
        title="Sources"
        description="Gérez les flux RSS et Atom surveillés"
        actions={
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        }
      />

      {showForm && (
        <FadeIn>
          <Card>
            <CardHeader><CardTitle className="text-base">Nouvelle source</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Nom</Label>
                  <Input
                    placeholder="Ex: Blog WordPress"
                    value={formData.name}
                    onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>URL du flux</Label>
                  <Input
                    placeholder="https://example.com/feed.xml"
                    value={formData.url}
                    onChange={(e: any) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Catégorie</Label>
                  <select
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                    value={formData.categorie}
                    onChange={(e: any) => setFormData({ ...formData, categorie: e.target.value })}
                  >
                    <option value="tendances">Tendances</option>
                    <option value="sécurité">Sécurité</option>
                    <option value="versions">Versions</option>
                  </select>
                </div>
              </div>
              <Button onClick={addSource} disabled={submitting} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Enregistrer
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      <Stagger className="space-y-3">
        {(sources ?? []).map((source: Source) => (
          <StaggerItem key={source.id}>
            <HoverLift>
              <Card className={!source.active ? 'opacity-60' : ''}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Rss className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{source.name}</span>
                      <Badge className={catColors[source.categorie] ?? catColors.tendances}>
                        {source.categorie}
                      </Badge>
                      {source.lastError ? (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertCircle className="h-3 w-3" /> Erreur
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-xs text-green-600 dark:text-green-400 border-green-300 dark:border-green-700">
                          <CheckCircle2 className="h-3 w-3" /> OK
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{source.url}</p>
                    {source.lastError && (
                      <p className="text-xs text-destructive mt-1 truncate">{source.lastError}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => toggleSource(source.id, source.active)}
                      title={source.active ? 'Désactiver' : 'Activer'}
                    >
                      {source.active ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => deleteSource(source.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </HoverLift>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
