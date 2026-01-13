import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AutoCreateUnitsDialog({ buildingId, open, onOpenChange, onUnitsCreated }) {
  const queryClient = useQueryClient();
  const [numUnits, setNumUnits] = useState('');
  const [unitType, setUnitType] = useState('residential');
  const [isLoading, setIsLoading] = useState(false);

  const createUnitsMutation = useMutation({
    mutationFn: async ({ buildingId, numUnits, unitType }) => {
      const unitsToCreate = Array.from({ length: parseInt(numUnits, 10) }, (_, i) => ({
        building_id: buildingId,
        unit_number: `EG-${i + 1}`,
        unit_type: unitType,
        status: 'vacant',
        sqm: 50,
        rooms: 2,
        floor: 0
      }));
      return await base44.functions.invoke('autoCreateUnits', { units: unitsToCreate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['buildingUnits', buildingId]);
      toast.success(`${numUnits} Einheiten erfolgreich erstellt!`);
      onUnitsCreated?.();
      onOpenChange(false);
      setNumUnits('');
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!numUnits || parseInt(numUnits, 10) <= 0) {
      toast.error('Gültige Anzahl erforderlich.');
      return;
    }
    setIsLoading(true);
    createUnitsMutation.mutate({ buildingId, numUnits, unitType });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Einheiten automatisch erstellen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Anzahl</Label>
            <Input type="number" min="1" value={numUnits} onChange={(e) => setNumUnits(e.target.value)} placeholder="10" disabled={isLoading} />
          </div>
          <div>
            <Label>Typ</Label>
            <Select value={unitType} onValueChange={setUnitType} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Wohnung</SelectItem>
                <SelectItem value="commercial">Gewerbe</SelectItem>
                <SelectItem value="parking">Stellplatz</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || !numUnits}>
            {isLoading ? 'Erstelle...' : 'Erstellen'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}