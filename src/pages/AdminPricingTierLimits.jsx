import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2 } from 'lucide-react';

const RESET_PERIODS = ['NEVER', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

export default function AdminPricingTierLimits() {
  const queryClient = useQueryClient();
  const [editingLimit, setEditingLimit] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState('');

  const { data: tiers = [] } = useQuery({
    queryKey: ['tiers'],
    queryFn: () => base44.entities.PricingTier.list()
  });

  const { data: tierLimits = [] } = useQuery({
    queryKey: ['tierLimits', selectedTier],
    queryFn: () => selectedTier ? base44.entities.TierLimit.filter({ tier_id: selectedTier }) : Promise.resolve([]),
    enabled: !!selectedTier
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingLimit?.id) {
        return await base44.entities.TierLimit.update(editingLimit.id, data);
      } else {
        return await base44.entities.TierLimit.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tierLimits', selectedTier] });
      setDialogOpen(false);
      setEditingLimit(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.TierLimit.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tierLimits', selectedTier] });
    }
  });

  const getTierName = (tierId) => tiers.find(t => t.id === tierId)?.data.name || tierId;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Tarif-Limits</h1>
        <p className="text-slate-600 mt-1">Definiere Nutzungslimits pro Tarif</p>
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
                <Button onClick={() => setEditingLimit(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Limit hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingLimit ? 'Limit bearbeiten' : 'Limit hinzufügen'}</DialogTitle>
                </DialogHeader>
                <LimitForm
                  limit={editingLimit}
                  tierId={selectedTier}
                  onSave={(data) => saveMutation.mutate(data)}
                  onCancel={() => {
                    setDialogOpen(false);
                    setEditingLimit(null);
                  }}
                  isSaving={saveMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {tierLimits.map(limit => (
              <Card key={limit.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-light">{limit.data.limit_name}</h3>
                      <p className="text-slate-600 text-sm mt-1">
                        {limit.data.limit_value === -1 ? 'Unbegrenzt' : `${limit.data.limit_value} ${limit.data.limit_unit}`}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Reset: {limit.data.reset_period}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditingLimit(limit);
                        setDialogOpen(true);
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (confirm('Wirklich löschen?')) {
                          deleteMutation.mutate(limit.id);
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

function LimitForm({ limit, tierId, onSave, onCancel, isSaving }) {
  const [formData, setFormData] = useState(limit?.data || {
    tier_id: tierId,
    limit_key: '',
    limit_name: '',
    limit_value: 0,
    limit_unit: '',
    overage_allowed: false,
    overage_price: 0,
    reset_period: 'MONTHLY',
    sort_order: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Schlüssel *</Label>
          <Input value={formData.limit_key} onChange={(e) => setFormData({ ...formData, limit_key: e.target.value })} placeholder="z.B. max_objects" required />
        </div>
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input value={formData.limit_name} onChange={(e) => setFormData({ ...formData, limit_name: e.target.value })} placeholder="z.B. Maximale Objekte" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Wert * (-1 = unbegrenzt)</Label>
          <Input type="number" value={formData.limit_value} onChange={(e) => setFormData({ ...formData, limit_value: parseInt(e.target.value) || 0 })} required />
        </div>
        <div className="space-y-2">
          <Label>Einheit</Label>
          <Input value={formData.limit_unit} onChange={(e) => setFormData({ ...formData, limit_unit: e.target.value })} placeholder="z.B. Objekte, WE" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Reset-Periode *</Label>
        <Select value={formData.reset_period} onValueChange={(value) => setFormData({ ...formData, reset_period: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESET_PERIODS.map(period => <SelectItem key={period} value={period}>{period}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" checked={formData.overage_allowed} onChange={(e) => setFormData({ ...formData, overage_allowed: e.target.checked })} />
        <Label>Überschreitung erlaubt</Label>
      </div>

      {formData.overage_allowed && (
        <div className="space-y-2">
          <Label>Preis pro Extra-Einheit (€)</Label>
          <Input type="number" step="0.01" value={formData.overage_price / 100} onChange={(e) => setFormData({ ...formData, overage_price: Math.round(parseFloat(e.target.value) * 100) })} />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Abbrechen</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Speichere...' : 'Speichern'}</Button>
      </div>
    </form>
  );
}