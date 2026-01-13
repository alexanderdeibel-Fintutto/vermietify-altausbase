import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, Camera, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AdminPricingExport() {
  const queryClient = useQueryClient();
  
  const [exportConfig, setExportConfig] = useState({
    include_products: true,
    include_features: true,
    include_tiers: true,
    include_bundles: true,
    include_discounts: true,
    include_triggers: true,
    only_active: false
  });

  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDesc, setSnapshotDesc] = useState('');

  const { data: snapshots = [], refetch: refetchSnapshots } = useQuery({
    queryKey: ['snapshots'],
    queryFn: () => base44.entities.PricingSnapshot.list('-created_date')
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('exportConfiguration', exportConfig);
      return response.data;
    },
    onSuccess: (data) => {
      // Download als JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pricing-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    }
  });

  const snapshotMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('createSnapshot', {
        snapshot_name: snapshotName,
        description: snapshotDesc,
        is_baseline: false
      });
      return response.data;
    },
    onSuccess: () => {
      refetchSnapshots();
      setSnapshotName('');
      setSnapshotDesc('');
    }
  });

  const deleteSnapshotMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.PricingSnapshot.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Export & Import</h1>
        <p className="text-slate-600 mt-1">Konfiguration sichern und wiederherstellen</p>
      </div>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">Export</CardTitle>
          <CardDescription>Exportiere die Pricing-Konfiguration als JSON</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries({
              include_products: 'Produkte',
              include_features: 'Features',
              include_tiers: 'Tarife',
              include_bundles: 'Bundles',
              include_discounts: 'Rabatte',
              include_triggers: 'Trigger'
            }).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <Switch
                  checked={exportConfig[key]}
                  onCheckedChange={(checked) => setExportConfig({ ...exportConfig, [key]: checked })}
                />
                <Label>{label}</Label>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={exportConfig.only_active}
              onCheckedChange={(checked) => setExportConfig({ ...exportConfig, only_active: checked })}
            />
            <Label>Nur aktive Einträge</Label>
          </div>

          <Button 
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            {exportMutation.isPending ? 'Exportiere...' : 'Als JSON exportieren'}
          </Button>
        </CardContent>
      </Card>

      {/* Snapshots */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">Snapshots</CardTitle>
          <CardDescription>Erstelle Wiederherstellungspunkte der Konfiguration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Neuer Snapshot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Snapshot erstellen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={snapshotName}
                    onChange={(e) => setSnapshotName(e.target.value)}
                    placeholder="z.B. Vor Launch März 2026"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Beschreibung</Label>
                  <Input
                    value={snapshotDesc}
                    onChange={(e) => setSnapshotDesc(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <Button
                  onClick={() => snapshotMutation.mutate()}
                  disabled={!snapshotName || snapshotMutation.isPending}
                  className="w-full"
                >
                  Snapshot erstellen
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Snapshot-Liste */}
          <div className="space-y-2">
            {snapshots.map(snapshot => (
              <div key={snapshot.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-light">{snapshot.data.snapshot_name}</div>
                  <div className="text-sm text-slate-500">
                    {new Date(snapshot.created_date).toLocaleDateString('de-DE')} • {snapshot.created_by}
                  </div>
                  {snapshot.data.is_baseline && (
                    <Badge variant="secondary" className="mt-1">Baseline</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Details ansehen"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Snapshot wirklich löschen?')) {
                        deleteSnapshotMutation.mutate(snapshot.id);
                      }
                    }}
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}

            {snapshots.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                Noch keine Snapshots vorhanden
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}