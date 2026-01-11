import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BuildingTemplateAssigner({ templateId, isOpen, onClose }) {
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const queryClient = useQueryClient();

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: currentTemplate } = useQuery({
    queryKey: ['template', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const templates = await base44.entities.DocumentTemplate.list();
      return templates.find(t => t.id === templateId);
    },
    enabled: !!templateId
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      // Create gebäude-specific copy
      const newTemplate = { ...currentTemplate };
      delete newTemplate.id;
      newTemplate.building_id = selectedBuilding;
      newTemplate.version = 1;
      
      return await base44.entities.DocumentTemplate.create(newTemplate);
    },
    onSuccess: () => {
      toast.success('Template dem Gebäude zugeordnet!');
      queryClient.invalidateQueries(['documentTemplates']);
      onClose();
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Template einem Gebäude zuordnen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Gebäude</label>
            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger>
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent>
                {buildings.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button onClick={() => assignMutation.mutate()} disabled={!selectedBuilding} className="flex-1">
              Zuordnen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}