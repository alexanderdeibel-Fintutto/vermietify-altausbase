import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Zap } from 'lucide-react';

const PRICE_TYPES = ['FREE', 'MONTHLY', 'YEARLY', 'ONE_TIME', 'PER_USE', 'PER_UNIT', 'TRANSACTION', 'AFFILIATE'];

export default function AdminPricingFeatures() {
  const queryClient = useQueryClient();
  const [editingFeature, setEditingFeature] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: features = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => base44.entities.Feature.list('-sort_order')
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['featureGroups'],
    queryFn: () => base44.entities.FeatureGroup.list()
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingFeature?.id) {
        return await base44.entities.Feature.update(editingFeature.id, data);
      } else {
        return await base44.entities.Feature.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      setDialogOpen(false);
      setEditingFeature(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Feature.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
    }
  });

  const getGroupName = (groupId) => groups.find(g => g.id === groupId)?.data.name || groupId;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Features</h1>
          <p className="text-slate-600 mt-1">Verwalte atomare Features</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingFeature(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Neues Feature
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFeature ? 'Feature bearbeiten' : 'Neues Feature'}</DialogTitle>
            </DialogHeader>
            <FeatureForm
              feature={editingFeature}
              groups={groups}
              onSave={(data) => saveMutation.mutate(data)}
              onCancel={() => {
                setDialogOpen(false);
                setEditingFeature(null);
              }}
              isSaving={saveMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {features.map(feature => (
          <Card key={feature.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-light">{feature.data.name}</h3>
                    <span className="text-xs text-slate-500 font-mono">{feature.data.feature_code}</span>
                  </div>
                  <p className="text-slate-600 mt-1 text-sm">{feature.data.description}</p>
                  <div className="mt-2 text-sm"><span className="text-slate-500">Gruppe:</span> {getGroupName(feature.data.group_id)} | <span className="text-slate-500">Preis-Typ:</span> {feature.data.price_type}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingFeature(feature);
                    setDialogOpen(true);
                  }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (confirm('Feature wirklich löschen?')) {
                      deleteMutation.mutate(feature.id);
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
    </div>
  );
}

function FeatureForm({ feature, groups, onSave, onCancel, isSaving }) {
  const [formData, setFormData] = useState(feature?.data || {
    feature_code: '',
    name: '',
    description: '',
    internal_notes: '',
    group_id: '',
    is_quantifiable: false,
    quantity_unit: '',
    standalone_price: 0,
    price_type: 'FREE',
    is_active: true,
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
          <Label>Code *</Label>
          <Input value={formData.feature_code} onChange={(e) => setFormData({ ...formData, feature_code: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Beschreibung</Label>
        <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
      </div>

      <div className="space-y-2">
        <Label>Gruppe *</Label>
        <Select value={formData.group_id} onValueChange={(value) => setFormData({ ...formData, group_id: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groups.map(group => <SelectItem key={group.id} value={group.id}>{group.data.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Preis-Typ *</Label>
        <Select value={formData.price_type} onValueChange={(value) => setFormData({ ...formData, price_type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRICE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" checked={formData.is_quantifiable} onChange={(e) => setFormData({ ...formData, is_quantifiable: e.target.checked })} />
        <Label>Mengenbasiert</Label>
      </div>

      {formData.is_quantifiable && (
        <div className="space-y-2">
          <Label>Einheit</Label>
          <Input value={formData.quantity_unit} onChange={(e) => setFormData({ ...formData, quantity_unit: e.target.value })} placeholder="z.B. Objekte, WE" />
        </div>
      )}

      <div className="space-y-2">
        <Label>Einzelpreis (€)</Label>
        <Input type="number" step="0.01" value={formData.standalone_price / 100} onChange={(e) => setFormData({ ...formData, standalone_price: Math.round(parseFloat(e.target.value) * 100) })} />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Abbrechen</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Speichere...' : 'Speichern'}</Button>
      </div>
    </form>
  );
}