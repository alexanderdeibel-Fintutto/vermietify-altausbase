import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Upload, Copy, Check } from 'lucide-react';

export default function AdminPricingExport() {
  const queryClient = useQueryClient();
  const [snapshots, setSnapshots] = useState([]);
  const [showCreateSnapshot, setShowCreateSnapshot] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDesc, setSnapshotDesc] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: allSnapshots = [] } = useQuery({
    queryKey: ['snapshots'],
    queryFn: () => base44.entities.PricingSnapshot.list('-created_date')
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('exportConfiguration');
    },
    onSuccess: (response) => {
      const dataStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pricing-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    }
  });

  const snapshotMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('createSnapshot', {
        snapshot_name: snapshotName,
        description: snapshotDesc,
        is_baseline: false,
        version: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
      setShowCreateSnapshot(false);
      setSnapshotName('');
      setSnapshotDesc('');
    }
  });

  const copySnapshot = (snapshot) => {
    const text = JSON.stringify(JSON.parse(snapshot.data.snapshot_data), null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Export & Snapshots</h1>
        <p className="text-slate-600 mt-1">Exportiere Pricing-Konfiguration und erstelle Snapshots</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending} className="flex items-center gap-2" size="lg">
          <Download className="w-4 h-4" />
          {exportMutation.isPending ? 'Exportiere...' : 'Exportieren'}
        </Button>

        <Dialog open={showCreateSnapshot} onOpenChange={setShowCreateSnapshot}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="lg">
              <Upload className="w-4 h-4 mr-2" />
              Snapshot erstellen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuer Snapshot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={snapshotName} onChange={(e) => setSnapshotName(e.target.value)} placeholder="z.B. Q1 2026 Pricing" />
              </div>
              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <Textarea value={snapshotDesc} onChange={(e) => setSnapshotDesc(e.target.value)} rows={3} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateSnapshot(false)}>Abbrechen</Button>
                <Button onClick={() => snapshotMutation.mutate()} disabled={!snapshotName || snapshotMutation.isPending}>
                  {snapshotMutation.isPending ? 'Erstelle...' : 'Erstellen'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <h2 className="text-xl font-light mb-4">Snapshots</h2>
        <div className="grid gap-4">
          {allSnapshots.map(snapshot => (
            <Card key={snapshot.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-light">{snapshot.data.snapshot_name}</h3>
                    <p className="text-slate-600 text-sm mt-1">{snapshot.data.description}</p>
                    <p className="text-xs text-slate-500 mt-2">v{snapshot.data.version} • {new Date(snapshot.created_date).toLocaleDateString('de-DE')}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copySnapshot(snapshot)}>
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}