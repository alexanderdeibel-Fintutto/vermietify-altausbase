import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminPricingFeatureGroups() {
  const queryClient = useQueryClient();
  const [editingGroup, setEditingGroup] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: groups = [] } = useQuery({
    queryKey: ['featureGroups'],
    queryFn: () => base44.entities.FeatureGroup.list('-sort_order')
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingGroup?.id) {
        return await base44.entities.FeatureGroup.update(editingGroup.id, data);
      } else {
        return await base44.entities.FeatureGroup.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureGroups'] });
      setDialogOpen(false);
      setEditingGroup(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.FeatureGroup.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureGroups'] });
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Feature-Gruppen</h1>
          <p className="text-slate-600 mt-1">Kategorisiere Features</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingGroup(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Neue Gruppe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingGroup ? 'Gruppe bearbeiten' : 'Neue Gruppe'}</DialogTitle>
            </DialogHeader>
            <GroupForm
              group={editingGroup}
              onSave={(data) => saveMutation.mutate(data)}
              onCancel={() => {
                setDialogOpen(false);
                setEditingGroup(null);
              }}
              isSaving={saveMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {groups.map(group => (
          <Card key={group.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-light">{group.data.name}</h3>
                  <p className="text-slate-600 mt-1 text-sm">{group.data.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingGroup(group);
                    setDialogOpen(true);
                  }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (confirm('Gruppe wirklich löschen?')) {
                      deleteMutation.mutate(group.id);
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

function GroupForm({ group, onSave, onCancel, isSaving }) {
  const [formData, setFormData] = useState(group?.data || {
    group_code: '',
    name: '',
    description: '',
    icon: 'Package',
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
          <Input value={formData.group_code} onChange={(e) => setFormData({ ...formData, group_code: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Beschreibung</Label>
        <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
      </div>

      <div className="space-y-2">
        <Label>Sortierung</Label>
        <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Abbrechen</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Speichere...' : 'Speichern'}</Button>
      </div>
    </form>
  );
}