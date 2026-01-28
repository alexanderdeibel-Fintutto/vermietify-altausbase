import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/components/services/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Building2, Home, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Step1BuildingSelection({ data, onNext, onDataChange, onSaveDraft, isSaving }) {
  const [selectedBuilding, setSelectedBuilding] = useState(data.building_id || '');
  const [periodStart, setPeriodStart] = useState(data.period_start || '');
  const [periodEnd, setPeriodEnd] = useState(data.period_end || '');
  const [selectedUnits, setSelectedUnits] = useState(data.selected_units || []);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_buildings_summary')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: allUnits = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_units_with_lease')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const filteredUnits = allUnits.filter(u => u.gebaeude_id === selectedBuilding);
  const totalSqm = filteredUnits
    .filter(u => selectedUnits.includes(u.id))
    .reduce((sum, u) => sum + (u.wohnflaeche_qm || 0), 0);
  const allUnitsHaveSqm = filteredUnits
    .filter(u => selectedUnits.includes(u.id))
    .every(u => u.wohnflaeche_qm && u.wohnflaeche_qm > 0);

  useEffect(() => {
    if (selectedBuilding && filteredUnits.length > 0 && selectedUnits.length === 0) {
      setSelectedUnits(filteredUnits.map(u => u.id));
    }
  }, [selectedBuilding]);

  const handleNext = () => {
    if (!selectedBuilding) {
      toast.error('Bitte wählen Sie ein Gebäude aus');
      return;
    }
    if (!periodStart || !periodEnd) {
      toast.error('Bitte geben Sie den Abrechnungszeitraum an');
      return;
    }
    if (selectedUnits.length === 0) {
      toast.error('Bitte wählen Sie mindestens eine Wohneinheit aus');
      return;
    }
    if (!allUnitsHaveSqm) {
      toast.error('Alle ausgewählten Einheiten müssen eine Wohnfläche (qm) haben');
      return;
    }

    onDataChange({
      building_id: selectedBuilding,
      period_start: periodStart,
      period_end: periodEnd,
      selected_units: selectedUnits
    });
    onNext();
  };

  const toggleUnit = (unitId) => {
    setSelectedUnits(prev => 
      prev.includes(unitId) 
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const selectedBuildingData = buildings.find(b => b.id === selectedBuilding);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Objekt & Abrechnungszeitraum</h2>
        <p className="text-gray-600">Wählen Sie das Gebäude und den Zeitraum für die Abrechnung</p>
      </div>

      {/* Gebäude auswählen */}
      <div className="space-y-2">
        <Label>Gebäude auswählen *</Label>
        <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
          <SelectTrigger>
            <SelectValue placeholder="Bitte wählen..." />
          </SelectTrigger>
          <SelectContent>
            {buildings.map(building => (
              <SelectItem key={building.id} value={building.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {building.name} - {building.address}, {building.city}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Abrechnungszeitraum */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Von *</Label>
          <Input 
            type="date" 
            value={periodStart} 
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Bis *</Label>
          <Input 
            type="date" 
            value={periodEnd} 
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </div>
      </div>

      {/* Wohneinheiten */}
      {selectedBuilding && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Wohneinheiten auswählen</Label>
            <div className="text-sm text-gray-600">
              {selectedUnits.length} von {filteredUnits.length} ausgewählt • {totalSqm.toFixed(2)} m²
            </div>
          </div>

          {!allUnitsHaveSqm && selectedUnits.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">
                Einige Einheiten haben keine Wohnfläche (qm) angegeben. Bitte ergänzen Sie die Stammdaten.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-3">
            {filteredUnits.map(unit => {
              const isSelected = selectedUnits.includes(unit.id);
              const hasQm = unit.wohnflaeche_qm && unit.wohnflaeche_qm > 0;

              return (
                <Card 
                  key={unit.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? 'border-blue-900 bg-blue-50' : 'hover:bg-gray-50'
                  } ${!hasQm ? 'border-red-300 bg-red-50' : ''}`}
                  onClick={() => toggleUnit(unit.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isSelected} />
                    <Home className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium">{unit.unit_number}</p>
                      <p className="text-sm text-gray-600">
                        {hasQm ? `${unit.wohnflaeche_qm} m²` : 'Keine qm-Angabe'}
                      </p>
                    </div>
                    {hasQm ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={handleSaveDraft}
          disabled={isSaving || !selectedBuilding}
        >
          {isSaving ? 'Speichert...' : 'Entwurf speichern'}
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!selectedBuilding || !periodStart || !periodEnd || selectedUnits.length === 0 || !allUnitsHaveSqm}
          className="bg-blue-900"
        >
          Weiter
        </Button>
      </div>
    </div>
  );
}