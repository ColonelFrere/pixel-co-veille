'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Save, Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layouts/page-header';
import { FadeIn } from '@/components/ui/animate';
import { toast } from 'sonner';

interface Profile {
  id: string;
  name: string;
  agency: string;
  stack: string[];
  priorities: string[];
}

export function ProfilClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStack, setNewStack] = useState('');
  const [newPriority, setNewPriority] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      setProfile(data?.profile ?? null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) toast.success('Profil mis à jour');
      else toast.error('Erreur lors de la sauvegarde');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const addStackItem = () => {
    if (!newStack.trim() || !profile) return;
    setProfile({ ...profile, stack: [...(profile.stack ?? []), newStack.trim()] });
    setNewStack('');
  };

  const removeStackItem = (idx: number) => {
    if (!profile) return;
    setProfile({ ...profile, stack: (profile.stack ?? []).filter((_: string, i: number) => i !== idx) });
  };

  const addPriority = () => {
    if (!newPriority.trim() || !profile) return;
    setProfile({ ...profile, priorities: [...(profile.priorities ?? []), newPriority.trim()] });
    setNewPriority('');
  };

  const removePriority = (idx: number) => {
    if (!profile) return;
    setProfile({ ...profile, priorities: (profile.priorities ?? []).filter((_: string, i: number) => i !== idx) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
        <p className="text-muted-foreground">Aucun profil trouvé.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      <PageHeader
        title="Profil agence"
        description="Ce profil est utilisé par l'IA pour évaluer la pertinence des articles"
        actions={
          <Button onClick={saveProfile} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        }
      />

      <FadeIn>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Informations</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nom</Label>
                <Input value={profile.name} onChange={(e: any) => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div>
                <Label>Activité</Label>
                <Input value={profile.agency} onChange={(e: any) => setProfile({ ...profile, agency: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Stack technique</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(profile.stack ?? []).map((item: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                    {item}
                    <button onClick={() => removeStackItem(idx)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ajouter une technologie..."
                  value={newStack}
                  onChange={(e: any) => setNewStack(e.target.value)}
                  onKeyDown={(e: any) => e.key === 'Enter' && addStackItem()}
                />
                <Button variant="outline" size="icon" onClick={addStackItem}><Plus className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-base">Priorités de veille</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(profile.priorities ?? []).map((item: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="gap-1 pr-1">
                    {item}
                    <button onClick={() => removePriority(idx)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ajouter une priorité..."
                  value={newPriority}
                  onChange={(e: any) => setNewPriority(e.target.value)}
                  onKeyDown={(e: any) => e.key === 'Enter' && addPriority()}
                />
                <Button variant="outline" size="icon" onClick={addPriority}><Plus className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>
    </div>
  );
}
