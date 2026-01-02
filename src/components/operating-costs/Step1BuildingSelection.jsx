import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Home, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Step1BuildingSelection({ data, onNext, onDataChange, onSaveDraft, isSaving }) {
    const [selectedBuilding, setSelectedBuilding] = useState(data.building_id || '');
    const [periodStart, setPeriodStart] = useState(data.period_start || '');
    const [periodEnd, setPeriodEnd] = useState(data.period_end || '');
    const [selectedUnits, setSelectedUnits] = useState(data.selected_units || []);

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const filteredUnits = units.filter(u => u.building_id === selectedBuilding);
    const totalSqm = filteredUnits.reduce((sum, u) => sum + (u.sqm || 0), 0);
    const allUnitsHaveSqm = filteredUnits.every(u => u.sqm && u.sqm > 0);

    useEffect(() => {
        if (selectedBuilding && filteredUnits.length > 0) {
            setSelectedUnits(filteredUnits.map(u => u.id));
        }
    }, [selectedBuilding]);

    const handleNext = () => {
        if (!selectedBuilding || !periodStart || !periodEnd) {
            toast.error('Bitte alle Felder ausfüllen');
            return;
        }
        if (selectedUnits.length === 0) {
            toast.error('Bitte mindestens eine Wohneinheit auswählen');
            return;
        }
        if (!allUnitsHaveSqm) {
            toast.error('Nicht alle Wohneinheiten haben eine QM-Angabe');
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

    return (
        <div className="space-y-6">
            <div>
                <Label>Gebäude *</Label>
                <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                    <SelectTrigger>
                        <SelectValue placeholder="Gebäude auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                        {buildings.map(building => (
                            <SelectItem key={building.id} value={building.id}>
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-slate-400" />
                                    {building.name}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Beginn Abrechnungszeitraum *</Label>
                    <Input
                        type="date"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                    />
                </div>
                <div>
                    <Label>Ende Abrechnungszeitraum *</Label>
                    <Input
                        type="date"
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                    />
                </div>
            </div>

            {selectedBuilding && filteredUnits.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">Wohneinheiten</h3>
                        <div className="text-sm text-slate-600">
                            Gesamt: <span className="font-semibold">{totalSqm.toFixed(2)} m²</span>
                        </div>
                    </div>

                    {!allUnitsHaveSqm && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                            <p className="text-sm text-red-700">
                                Nicht alle Wohneinheiten haben eine QM-Angabe. Bitte ergänzen Sie diese vor der Abrechnung.
                            </p>
                        </div>
                    )}

                    {allUnitsHaveSqm && (
                        <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                            <p className="text-sm text-emerald-700">
                                Alle Wohneinheiten haben eine vollständige QM-Angabe.
                            </p>
                        </div>
                    )}

                    <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-4">
                        {filteredUnits.map(unit => (
                            <div key={unit.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        checked={selectedUnits.includes(unit.id)}
                                        onCheckedChange={() => toggleUnit(unit.id)}
                                    />
                                    <Home className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium text-slate-800">{unit.unit_number}</span>
                                </div>
                                <div className="text-sm text-slate-600">
                                    {unit.sqm ? (
                                        <span className="flex items-center gap-1">
                                            {unit.sqm.toFixed(2)} m²
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-red-600">
                                            Keine Angabe
                                            <AlertCircle className="w-4 h-4" />
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-between pt-4">
                <Button 
                    variant="outline"
                    onClick={onSaveDraft}
                    disabled={!selectedBuilding || !periodStart || !periodEnd || isSaving}
                >
                    {isSaving ? 'Speichert...' : 'Beenden & Speichern'}
                </Button>
                <Button 
                    onClick={handleNext}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={!selectedBuilding || !periodStart || !periodEnd || selectedUnits.length === 0 || !allUnitsHaveSqm}
                >
                    Weiter
                </Button>
            </div>
        </div>
    );
}