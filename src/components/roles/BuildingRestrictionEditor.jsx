import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Building2 } from 'lucide-react';

export default function BuildingRestrictionEditor({ 
  open, 
  onOpenChange, 
  selectedBuildings = [], 
  onSave 
}) {
  const [selected, setSelected] = useState(selectedBuildings);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const handleToggle = (buildingId) => {
    setSelected(prev => 
      prev.includes(buildingId) 
        ? prev.filter(id => id !== buildingId)
        : [...prev, buildingId]
    );
  };

  const handleSave = () => {
    onSave(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gebäude-Einschränkungen festlegen</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-slate-600">
            {selected.length === 0 
              ? 'Keine Einschränkung - Zugriff auf alle Gebäude' 
              : `Zugriff auf ${selected.length} Gebäude eingeschränkt`}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {buildings.map(building => (
              <div 
                key={building.id} 
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selected.includes(building.id) 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => handleToggle(building.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={selected.includes(building.id)}
                    onCheckedChange={() => handleToggle(building.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-sm">{building.name}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {building.address} {building.house_number}, {building.city}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {building.total_units || 0} Einheiten
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setSelected([])}
            >
              Alle entfernen
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Abbrechen
              </Button>
              <Button onClick={handleSave}>
                Speichern ({selected.length})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}