import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AddPermissionDialog({ isOpen, onClose, user, buildings, existingPermissions }) {
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [permissionLevel, setPermissionLevel] = useState('read');
  const queryClient = useQueryClient();

  const availableBuildings = buildings.filter(b => 
    !existingPermissions.some(p => p.building_id === b.id)
  );

  const createPermissionMutation = useMutation({
    mutationFn: (newPermission) => base44.entities.BuildingPermission.create(newPermission),
    onSuccess: () => {
      toast.success('Berechtigung hinzugefügt.');
      queryClient.invalidateQueries({ queryKey: ['buildingPermissions'] });
      onClose();
      setSelectedBuilding('');
      setPermissionLevel('read');
    },
    onError: (error) => {
      toast.error('Fehler beim Hinzufügen der Berechtigung: ' + error.message);
    }
  });

  const handleSubmit = () => {
    if (!selectedBuilding) {
      toast.error('Bitte wählen Sie ein Gebäude aus.');
      return;
    }
    createPermissionMutation.mutate({
      user_email: user.email,
      building_id: selectedBuilding,
      permission_level: permissionLevel
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Berechtigung für {user.full_name} hinzufügen</DialogTitle>
          <DialogDescription>
            Wählen Sie ein Gebäude und die gewünschte Berechtigungsstufe aus.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Gebäude</label>
            <Select onValueChange={setSelectedBuilding} value={selectedBuilding}>
              <SelectTrigger>
                <SelectValue placeholder="Gebäude auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {availableBuildings.length > 0 ? availableBuildings.map(building => (
                  <SelectItem key={building.id} value={building.id}>{building.name}</SelectItem>
                )) : <p className="p-4 text-sm text-slate-500">Keine weiteren Gebäude verfügbar.</p>}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Berechtigungsstufe</label>
            <Select onValueChange={setPermissionLevel} value={permissionLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">Lesezugriff</SelectItem>
                <SelectItem value="write">Schreibzugriff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={createPermissionMutation.isPending || !selectedBuilding}>
            {createPermissionMutation.isPending ? 'Speichern...' : 'Speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}