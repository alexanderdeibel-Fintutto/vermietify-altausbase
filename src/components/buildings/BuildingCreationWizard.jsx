import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowRight, ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BuildingCreationWizard({ open, onClose, onBuildingCreated }) {
  const [step, setStep] = useState(1);
  const [createdBuildingId, setCreatedBuildingId] = useState(null);
  const [buildingData, setBuildingData] = useState({
    name: '',
    address: '',
    postal_code: '',
    city: '',
    year_built: new Date().getFullYear(),
    total_units: 1,
    gesamtflaeche_wohn: '',
    heizungsart: 'Gas',
    denkmalschutz: false,
    objekt_status: 'Aktiv'
  });
  const [units, setUnits] = useState([
    { unit_number: '1', wohnflaeche_qm: '', anzahl_zimmer: '', heizung_typ: 'Zentralheizung', warmwasser_typ: 'Zentral' }
  ]);
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createBuildingMutation = useMutation({
    mutationFn: (data) => base44.entities.Building.create(data),
    onSuccess: (building) => {
      setCreatedBuildingId(building.id);
      setStep(2);
      toast.success('Gebäude erstellt');
    }
  });

  const createUnitsMutation = useMutation({
    mutationFn: async (unitsData) => {
      const promises = unitsData.map(unit => 
        base44.entities.Unit.create({
          ...unit,
          gebaeude_id: createdBuildingId,
          einheit_typ: 'Wohnung',
          vermietungsstatus: 'Leerstand'
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['buildings']);
      queryClient.invalidateQueries(['buildingUnits', createdBuildingId]);
      setStep(3);
      toast.success(`${units.length} Einheiten erstellt`);
    }
  });

  const handleBuildingSubmit = (e) => {
    e.preventDefault();
    createBuildingMutation.mutate(buildingData);
  };

  const handleUnitsSubmit = () => {
    const validUnits = units.filter(u => u.unit_number && u.wohnflaeche_qm);
    if (validUnits.length === 0) {
      toast.error('Mindestens eine Einheit mit Nummer und Fläche erforderlich');
      return;
    }
    createUnitsMutation.mutate(validUnits);
  };

  const handleFinish = () => {
    onClose();
    if (onBuildingCreated) onBuildingCreated(createdBuildingId);
    navigate(createPageUrl('BuildingDetail') + `?id=${createdBuildingId}`);
  };

  const addUnit = () => {
    setUnits([...units, { 
      unit_number: (units.length + 1).toString(), 
      wohnflaeche_qm: '', 
      anzahl_zimmer: '',
      heizung_typ: 'Zentralheizung',
      warmwasser_typ: 'Zentral'
    }]);
  };

  const removeUnit = (index) => {
    setUnits(units.filter((_, i) => i !== index));
  };

  const updateUnit = (index, field, value) => {
    const newUnits = [...units];
    newUnits[index][field] = value;
    setUnits(newUnits);
  };

  const progress = (step / 3) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neues Gebäude erstellen - Schritt {step} von 3</DialogTitle>
        </DialogHeader>

        <Progress value={progress} className="mb-4" />

        {step === 1 && (
          <form onSubmit={handleBuildingSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Objektname *</Label>
                <Input
                  value={buildingData.name}
                  onChange={e => setBuildingData({...buildingData, name: e.target.value})}
                  placeholder="z.B. Musterstraße 1"
                  required
                />
              </div>
              <div>
                <Label>Baujahr *</Label>
                <Input
                  type="number"
                  value={buildingData.year_built}
                  onChange={e => setBuildingData({...buildingData, year_built: parseInt(e.target.value)})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>Straße & Hausnummer *</Label>
                <Input
                  value={buildingData.address}
                  onChange={e => setBuildingData({...buildingData, address: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>PLZ *</Label>
                <Input
                  value={buildingData.postal_code}
                  onChange={e => setBuildingData({...buildingData, postal_code: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ort *</Label>
                <Input
                  value={buildingData.city}
                  onChange={e => setBuildingData({...buildingData, city: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Wohnfläche gesamt (m²) *</Label>
                <Input
                  type="number"
                  value={buildingData.gesamtflaeche_wohn}
                  onChange={e => setBuildingData({...buildingData, gesamtflaeche_wohn: parseFloat(e.target.value)})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Anzahl Wohneinheiten *</Label>
                <Input
                  type="number"
                  value={buildingData.total_units}
                  onChange={e => setBuildingData({...buildingData, total_units: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div>
                <Label>Heizungsart *</Label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={buildingData.heizungsart}
                  onChange={e => setBuildingData({...buildingData, heizungsart: e.target.value})}
                  required
                >
                  <option value="Gas">Gas</option>
                  <option value="Öl">Öl</option>
                  <option value="Fernwärme">Fernwärme</option>
                  <option value="Wärmepumpe">Wärmepumpe</option>
                  <option value="Elektro">Elektro</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={createBuildingMutation.isPending}>
                Weiter <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Fügen Sie nun die Einheiten (Wohnungen) zu diesem Gebäude hinzu.
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {units.map((unit, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Einheit-Nr. *</Label>
                      <Input
                        value={unit.unit_number}
                        onChange={e => updateUnit(index, 'unit_number', e.target.value)}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Fläche (m²) *</Label>
                      <Input
                        type="number"
                        value={unit.wohnflaeche_qm}
                        onChange={e => updateUnit(index, 'wohnflaeche_qm', parseFloat(e.target.value))}
                        placeholder="75"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Zimmer</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={unit.anzahl_zimmer}
                        onChange={e => updateUnit(index, 'anzahl_zimmer', parseFloat(e.target.value))}
                        placeholder="3"
                      />
                    </div>
                    <div className="flex items-end">
                      {units.length > 1 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeUnit(index)}
                          className="w-full"
                        >
                          Entfernen
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={addUnit} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Weitere Einheit hinzufügen
            </Button>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Überspringen
                </Button>
                <Button onClick={handleUnitsSubmit} disabled={createUnitsMutation.isPending}>
                  Einheiten erstellen <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center py-8">
            <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Gebäude erfolgreich erstellt!</h3>
              <p className="text-slate-600 mt-2">
                {units.length} Einheit{units.length !== 1 ? 'en' : ''} wurden hinzugefügt.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 text-left">
              <p className="text-sm font-medium text-slate-900 mb-2">Nächste Schritte:</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Kaufvertrag erfassen (für AfA-Berechnung)</li>
                <li>• Finanzierung hinzufügen (falls vorhanden)</li>
                <li>• Mietverträge anlegen</li>
                <li>• Zählerstände erfassen</li>
              </ul>
            </div>

            <Button onClick={handleFinish} className="w-full">
              Zum Gebäude <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}