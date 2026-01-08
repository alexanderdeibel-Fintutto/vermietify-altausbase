import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function BuildingEditDialog({ building, open, onOpenChange }) {
  const [formData, setFormData] = useState(building || {});
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Building.update(building.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast.success('Gebäude aktualisiert');
      onOpenChange(false);
    },
    onError: () => toast.error('Fehler beim Speichern')
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (!building) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gebäude bearbeiten</DialogTitle>
          <DialogDescription>{building.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Stadt</label>
              <Input
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">PLZ</label>
              <Input
                value={formData.zip || ''}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Adresse</label>
            <Input
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Notizen</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm"
              rows="3"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Speichern...
              </>
            ) : (
              'Speichern'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}