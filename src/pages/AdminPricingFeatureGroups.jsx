import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Check, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPricingFeatureGroups() {
  const [editingGroup, setEditingGroup] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: groups = [] } = useQuery({
    queryKey: ['featureGroups'],
    queryFn: () => base44.entities.FeatureGroup.list('-sort_order')
  });

  const { data: features = [] } = useQuery({
    queryKey: ['allFeatures'],
    queryFn: () => base44.entities.Feature.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FeatureGroup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureGroups'] });
      setDialogOpen(false);
      setEditingGroup(null);
      toast.success('Gruppe erstellt');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FeatureGroup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureGroups'] });
      setDialogOpen(false);
      setEditingGroup(null);
      toast.success('Gruppe aktualisiert');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FeatureGroup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureGroups'] });
      toast.success('Gruppe gelöscht');
    }
  });

  const getFeatureCount = (groupId) => {
    return features.filter(f => f.group_id === groupId).length;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-slate-900">Feature-Gruppen</h1>
          <p className="text-sm text-slate-600">Kategorisiere Features für bessere Übersicht</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingGroup(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Gruppe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGroup ? 'Gruppe bearbeiten' : 'Neue Gruppe'}</DialogTitle>
            </DialogHeader>
            <GroupForm 
              group={editingGroup}
              onSave={(data) => {
                if (editingGroup) {
                  updateMutation.mutate({ id: editingGroup.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setDialogOpen(false);
                setEditingGroup(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-sm text-slate-600">
                <th className="text-left p-4 font-medium w-8"></th>
                <th className="text-left p-4 font-medium">Code</th>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Icon</th>
                <th className="text-right p-4 font-medium">Features</th>
                <th className="text-right p-4 font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(group => (
                <tr key={group.id} className="border-b hover:bg-slate-50">
                  <td className="p-4">
                    <GripVertical className="h-4 w-4 text-slate-400" />
                  </td>
                  <td className="p-4">
                    <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                      {group.group_code}
                    </code>
                  </td>
                  <td className="p-4 font-medium">{group.name}</td>
                  <td className="p-4 text-sm text-slate-600">{group.icon}</td>
                  <td className="p-4 text-right text-sm">{getFeatureCount(group.id)}</td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setEditingGroup(group);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          if (confirm('Gruppe wirklich löschen?')) {
                            deleteMutation.mutate(group.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function GroupForm({ group, onSave, onCancel }) {
  const [formData, setFormData] = useState(group || {
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
          <Input 
            value={formData.group_code} 
            onChange={e => setFormData({...formData, group_code: e.target.value.toUpperCase()})}
            placeholder="OBJEKT"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="Objekt-Management"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Beschreibung</Label>
        <Textarea 
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Icon</Label>
          <Input 
            value={formData.icon} 
            onChange={e => setFormData({...formData, icon: e.target.value})}
            placeholder="Building2"
          />
        </div>
        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input 
            type="number"
            value={formData.sort_order} 
            onChange={e => setFormData({...formData, sort_order: Number(e.target.value)})}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
        <Button type="submit" className="flex-1">
          <Check className="h-4 w-4 mr-2" />
          Speichern
        </Button>
      </div>
    </form>
  );
}