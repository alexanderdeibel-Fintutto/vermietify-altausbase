import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function QuickContractCreator({ open, onOpenChange }) {
  const [building, setBuilding] = useState('');
  const [unit, setUnit] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [rent, setRent] = useState('');
  const [startDate, setStartDate] = useState('');
  const queryClient = useQueryClient();

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', building],
    queryFn: async () => {
      if (!building) return [];
      const all = await base44.entities.Unit.list();
      return all.filter(u => u.building_id === building);
    },
    enabled: !!building
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.LeaseContract.create({
        building_id: building,
        unit_id: unit,
        tenant_name: tenantName,
        rent_amount: parseFloat(rent),
        start_date: startDate,
        status: 'active'
      });
    },
    onSuccess: (newContract) => {
      toast.success('Mietvertrag erstellt!');
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      onOpenChange(false);
      
      // Reset form
      setBuilding('');
      setUnit('');
      setTenantName('');
      setRent('');
      setStartDate('');
    },
    onError: () => {
      toast.error('Fehler beim Erstellen des Vertrags');
    }
  });

  const canCreate = building && unit && tenantName && rent && startDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Neuer Mietvertrag
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-xs">Gebäude</Label>
            <Select value={building} onValueChange={setBuilding}>
              <SelectTrigger>
                <SelectValue placeholder="Gebäude wählen" />
              </SelectTrigger>
              <SelectContent>
                {buildings.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {building && (
            <div>
              <Label className="text-xs">Einheit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Einheit wählen" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.unit_number || u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-xs">Mieter</Label>
            <Input 
              placeholder="Name des Mieters"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-xs">Miete (€/Monat)</Label>
            <Input 
              type="number"
              placeholder="0.00"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-xs">Startdatum</Label>
            <Input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Abbrechen
            </Button>
            <Button 
              onClick={() => createMutation.mutate()}
              disabled={!canCreate || createMutation.isPending}
              className="flex-1 bg-emerald-600"
            >
              Erstellen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}