import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function AdminPricingFeatureGroups() {
  const [editDialog, setEditDialog] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: groups = [] } = useQuery({
    queryKey: ['featureGroups'],
    queryFn: () => base44.entities.FeatureGroup.list('sort_order')
  });

  const { data: features = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => base44.entities.Feature.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FeatureGroup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['featureGroups']);
      setEditDialog(null);
      toast.success('Gruppe erstellt');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FeatureGroup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['featureGroups']);
      setEditDialog(null);
      toast.success('Gruppe aktualisiert');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FeatureGroup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['featureGroups']);
      setDeleteDialog(null);
      toast.success('Gruppe gelöscht');
    }
  });

  const handleSave = () => {
    if (editDialog?.id) {
      updateMutation.mutate({ id: editDialog.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEdit = (group = null) => {
    if (group) {
      setFormData({ ...group });
    } else {
      setFormData({
        group_code: '',
        name: '',
        description: '',
        icon: '',
        sort_order: groups.length + 1
      });
    }
    setEditDialog(group || { new: true });
  };

  const getFeatureCount = (groupId) => {
    return features.filter(f => f.group_id === groupId).length;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Feature-Gruppen</h1>
          <p className="text-slate-500 mt-1">Kategorien für Features</p>
        </div>
        <Button onClick={() => openEdit()}>
          <Plus className="w-4 h-4 mr-2" />
          Neue Gruppe
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">#</th>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Code</th>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Icon</th>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Features</th>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id} className="border-b hover:bg-slate-50">
                  <td className="p-4">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                  </td>
                  <td className="p-4">
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">{group.group_code}</code>
                  </td>
                  <td className="p-4 font-medium">{group.name}</td>
                  <td className="p-4">
                    <span className="text-2xl">{group.icon}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-slate-600">{getFeatureCount(group.id)} Features</span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(group)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteDialog(group)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editDialog?.new ? 'Neue Gruppe' : 'Gruppe bearbeiten'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Code *</Label>
              <Input
                value={formData.group_code || ''}
                onChange={e => setFormData({ ...formData, group_code: e.target.value.toUpperCase() })}
                placeholder="OBJEKT"
              />
            </div>

            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Objekt-Management"
              />
            </div>

            <div>
              <Label>Beschreibung</Label>
              <Textarea
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Icon (Lucide)</Label>
                <Input
                  value={formData.icon || ''}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Building2"
                />
              </div>
              <div>
                <Label>Sortierung *</Label>
                <Input
                  type="number"
                  value={formData.sort_order || 0}
                  onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialog(null)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>
              Speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gruppe löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Gruppe "{deleteDialog?.name}" wirklich löschen? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteDialog.id)}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}