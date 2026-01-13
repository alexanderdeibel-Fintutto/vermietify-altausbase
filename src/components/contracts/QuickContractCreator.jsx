import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import PostContractDialog from './PostContractDialog';

export default function QuickContractCreator({ open, onOpenChange }) {
  const [building, setBuilding] = useState('');
  const [unit, setUnit] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [rent, setRent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [createdContractId, setCreatedContractId] = useState(null);
  const queryClient = useQueryClient();
  
  const selectedUnit = units.find(u => u.id === unit);
  const selectedBuilding = buildings.find(b => b.id === building);

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
      setCreatedContractId(newContract.id);
      setPostDialogOpen(true);
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
  
  const rentalPrice = parseFloat(rent) || 0;
  const sqm = selectedUnit?.sqm || 1;
  const pricePerSqm = sqm > 0 ? rentalPrice / sqm : 0;
  const showPriceWarning = pricePerSqm > 20;

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
            {showPriceWarning && sqm && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Mietpreis über Durchschnitt ({pricePerSqm.toFixed(2)}€/m²) – Mietpreisbremse prüfen?</span>
              </div>
            )}
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

          <PostContractDialog 
          open={postDialogOpen} 
          onOpenChange={setPostDialogOpen} 
          contractId={createdContractId}
          />
          </Dialog>
          );
          }