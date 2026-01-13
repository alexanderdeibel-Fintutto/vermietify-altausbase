import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2 } from 'lucide-react';

const AVAILABILITIES = ['INCLUDED', 'ADDON', 'NOT_AVAILABLE'];

export default function AdminPricingTierFeatures() {
  const queryClient = useQueryClient();
  const [editingTierFeature, setEditingTierFeature] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState('');

  const { data: tiers = [] } = useQuery({
    queryKey: ['tiers'],
    queryFn: () => base44.entities.PricingTier.list()
  });

  const { data: features = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => base44.entities.Feature.list()
  });

  const { data: tierFeatures = [] } = useQuery({
    queryKey: ['tierFeatures', selectedTier],
    queryFn: () => selectedTier ? base44.entities.TierFeature.filter({ tier_id: selectedTier }) : Promise.resolve([]),
    enabled: !!selectedTier
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingTierFeature?.id) {
        return await base44.entities.TierFeature.update(editingTierFeature.id, data);
      } else {
        return await base44.entities.TierFeature.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tierFeatures', selectedTier] });
      setDialogOpen(false);
      setEditingTierFeature(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.TierFeature.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tierFeatures', selectedTier] });
    }
  });

  const getFeatureName = (featureId) => features.find(f => f.id === featureId)?.data.name || featureId;
  const getTierName = (tierId) => tiers.find(t => t.id === tierId)?.data.name || tierId;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Tarif-Features</h1>
        <p className="text-slate-600 mt-1">Definiere Feature-Verfügbarkeit pro Tarif</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>Tarif wählen</Label>
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger>
                <SelectValue placeholder="Tarif auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {tiers.map(tier => <SelectItem key={tier.id} value={tier.id}>{tier.data.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedTier && (
        <>
          <div className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingTierFeature(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Feature hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingTierFeature ? 'Feature bearbeiten' : 'Feature hinzufügen'}</DialogTitle>
                </DialogHeader>
                <TierFeatureForm
                  tierFeature={editingTierFeature}
                  tierId={selectedTier}
                  features={features}
                  onSave={(data) => saveMutation.mutate(data)}
                  onCancel={() => {
                    setDialogOpen(false);
                    setEditingTierFeature(null);
                  }}
                  isSaving={saveMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {tierFeatures.map(tf => (
              <Card key={tf.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-light">{getFeatureName(tf.data.feature_id)}</h3>
                      <p className="text-slate-600 text-sm mt-1">Verfügbarkeit: {tf.data.availability}</p>
                      {tf.data.addon_price_monthly && (
                        <p className="text-sm text-slate-600 mt-1">{(tf.data.addon_price_monthly / 100).toFixed(2)}€/Monat</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditingTierFeature(tf);
                        setDialogOpen(true);
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (confirm('Wirklich löschen?')) {
                          deleteMutation.mutate(tf.id);
                        }
                      }}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TierFeatureForm({ tierFeature, tierId, features, onSave, onCancel, isSaving }) {
  const [formData, setFormData] = useState(tierFeature?.data || {
    tier_id: tierId,
    feature_id: '',
    availability: 'INCLUDED',
    addon_price_monthly: 0,
    addon_price_yearly: 0,
    quantity_included: 0,
    sort_order: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Feature *</Label>
        <Select value={formData.feature_id} onValueChange={(value) => setFormData({ ...formData, feature_id: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {features.map(f => <SelectItem key={f.id} value={f.id}>{f.data.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Verfügbarkeit *</Label>
        <Select value={formData.availability} onValueChange={(value) => setFormData({ ...formData, availability: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AVAILABILITIES.map(av => <SelectItem key={av} value={av}>{av}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {formData.availability === 'ADDON' && (
        <>
          <div className="space-y-2">
            <Label>Aufpreis monatlich (€)</Label>
            <Input type="number" step="0.01" value={formData.addon_price_monthly / 100} onChange={(e) => setFormData({ ...formData, addon_price_monthly: Math.round(parseFloat(e.target.value) * 100) })} />
          </div>
          <div className="space-y-2">
            <Label>Aufpreis jährlich (€)</Label>
            <Input type="number" step="0.01" value={formData.addon_price_yearly / 100} onChange={(e) => setFormData({ ...formData, addon_price_yearly: Math.round(parseFloat(e.target.value) * 100) })} />
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Abbrechen</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Speichere...' : 'Speichern'}</Button>
      </div>
    </form>
  );
}