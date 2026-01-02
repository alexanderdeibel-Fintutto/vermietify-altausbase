import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Home, AlertCircle, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Step4DirectCosts({ data, onNext, onBack, onDataChange }) {
    const [manualCosts, setManualCosts] = useState([]);
    const [allocations, setAllocations] = useState({});
    const [expandedCosts, setExpandedCosts] = useState(new Set());
    const [expandedUnits, setExpandedUnits] = useState({});
    const [newCostName, setNewCostName] = useState('');
    const [newCostTotal, setNewCostTotal] = useState('');

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    // Get direct costs from Step 3 (distribution_key === 'direkt')
    const directCostsFromStep3 = Object.values(data.costs || {})
        .filter(c => c.selected && c.distribution_key === 'direkt')
        .map(c => ({
            id: c.costType.id,
            name: c.costType.sub_category,
            total: c.total,
            isFromStep3: true
        }));

    // All costs to display (Step 3 direct + manual)
    const allCosts = [...directCostsFromStep3, ...manualCosts];

    // Group contracts and vacancies by unit
    const unitGroups = React.useMemo(() => {
        const groups = {};
        
        data.selected_units.forEach(unitId => {
            const unit = units.find(u => u.id === unitId);
            if (!unit) return;

            const unitContracts = (data.contracts || []).filter(c => c.unit_id === unitId);
            const unitVacancies = (data.vacancies || []).filter(v => v.unit_id === unitId);

            groups[unitId] = {
                unit,
                contracts: unitContracts,
                vacancies: unitVacancies,
                items: [...unitContracts, ...unitVacancies]
            };
        });

        return groups;
    }, [data.selected_units, data.contracts, data.vacancies, units]);

    useEffect(() => {
        // Initialize allocations
        const initial = {};
        allCosts.forEach(cost => {
            initial[cost.id] = {};
            Object.values(unitGroups).forEach(group => {
                group.items.forEach(item => {
                    const itemKey = item.id || `vacancy-${item.unit_id}`;
                    initial[cost.id][itemKey] = 0;
                });
            });
        });
        setAllocations(initial);
    }, [allCosts.length, Object.keys(unitGroups).length]);

    const addManualCost = () => {
        if (!newCostName || !newCostTotal) {
            toast.error('Bitte Name und Gesamtsumme eingeben');
            return;
        }

        const newCost = {
            id: `manual-${Date.now()}`,
            name: newCostName === 'custom' ? document.getElementById('customCostName')?.value : newCostName,
            total: parseFloat(newCostTotal),
            isManual: true
        };

        setManualCosts(prev => [...prev, newCost]);
        setNewCostName('');
        setNewCostTotal('');
        toast.success('Kostenart hinzugefügt');
    };

    const removeManualCost = (costId) => {
        setManualCosts(prev => prev.filter(c => c.id !== costId));
        setAllocations(prev => {
            const newAllocations = { ...prev };
            delete newAllocations[costId];
            return newAllocations;
        });
        toast.success('Kostenart entfernt');
    };

    const toggleCost = (costId) => {
        setExpandedCosts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(costId)) {
                newSet.delete(costId);
            } else {
                newSet.add(costId);
            }
            return newSet;
        });
    };

    const toggleUnit = (costId, unitId) => {
        setExpandedUnits(prev => ({
            ...prev,
            [costId]: {
                ...prev[costId],
                [unitId]: !prev[costId]?.[unitId]
            }
        }));
    };

    const updateAllocation = (costId, itemKey, amount) => {
        setAllocations(prev => ({
            ...prev,
            [costId]: {
                ...prev[costId],
                [itemKey]: parseFloat(amount) || 0
            }
        }));
    };

    const getTotalAllocated = (costId) => {
        return Object.values(allocations[costId] || {}).reduce((sum, val) => sum + val, 0);
    };

    const handleNext = () => {
        // Validate allocations
        for (const cost of allCosts) {
            const allocated = getTotalAllocated(cost.id);
            if (Math.abs(allocated - cost.total) > 0.01) {
                toast.error(`Kosten für "${cost.name}" sind nicht vollständig zugewiesen (${allocated.toFixed(2)} / ${cost.total.toFixed(2)})`);
                return;
            }
        }

        onDataChange({ 
            directCosts: allocations,
            manualCosts: manualCosts
        });
        onNext();
    };

    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Direkte- und Verbrauchskosten</h3>
                <p className="text-sm text-slate-600">
                    Fügen Sie Kosten hinzu, die noch nicht erfasst wurden, und ordnen Sie diese den Mietverträgen und Leerständen zu
                </p>
            </div>

            {/* Add Manual Cost Section */}
            <Card className="p-4 bg-emerald-50 border-emerald-200">
                <h4 className="font-semibold text-slate-800 mb-3">Neue Kostenart hinzufügen</h4>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <Label className="text-xs">Kostenart</Label>
                        <Select value={newCostName} onValueChange={setNewCostName}>
                            <SelectTrigger>
                                <SelectValue placeholder="Auswählen..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Kaltwasser">Kaltwasser</SelectItem>
                                <SelectItem value="Heizkosten">Heizkosten</SelectItem>
                                <SelectItem value="Warmwasser">Warmwasser</SelectItem>
                                <SelectItem value="Strom">Strom</SelectItem>
                                <SelectItem value="custom">Sonstiges (eigene Eingabe)</SelectItem>
                            </SelectContent>
                        </Select>
                        {newCostName === 'custom' && (
                            <Input
                                id="customCostName"
                                placeholder="Kostenart eingeben..."
                                className="mt-2"
                            />
                        )}
                    </div>
                    <div>
                        <Label className="text-xs">Gesamtsumme (€)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={newCostTotal}
                            onChange={(e) => setNewCostTotal(e.target.value)}
                        />
                    </div>
                    <div className="flex items-end">
                        <Button 
                            onClick={addManualCost}
                            className="bg-emerald-600 hover:bg-emerald-700 w-full"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Hinzufügen
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Display all costs */}
            {allCosts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-600">Keine Kosten zum Zuordnen vorhanden</p>
                    <p className="text-sm text-slate-500 mt-2">Fügen Sie eine Kostenart hinzu oder wählen Sie in Schritt 3 Kosten mit direkter Zuordnung aus</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {allCosts.map(cost => {
                        const isExpanded = expandedCosts.has(cost.id);
                        const allocated = getTotalAllocated(cost.id);
                        const remaining = cost.total - allocated;

                        return (
                            <Card key={cost.id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => toggleCost(cost.id)}
                                        className="flex items-center gap-2 flex-1 text-left"
                                    >
                                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                        <div>
                                            <h4 className="font-semibold text-slate-800">{cost.name}</h4>
                                            <div className="flex items-center gap-4 mt-1 text-sm">
                                                <span className="text-slate-600">
                                                    Gesamt: <span className="font-semibold">€{cost.total.toFixed(2)}</span>
                                                </span>
                                                <span className="text-slate-600">
                                                    Zugewiesen: <span className="font-semibold">€{allocated.toFixed(2)}</span>
                                                </span>
                                                <span className={`font-semibold ${Math.abs(remaining) < 0.01 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    Verbleibend: €{remaining.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                    {cost.isManual && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeManualCost(cost.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 space-y-2 pl-7">
                                        {Object.entries(unitGroups).map(([unitId, group]) => {
                                            const isUnitExpanded = expandedUnits[cost.id]?.[unitId];
                                            const unitTotal = group.items.reduce((sum, item) => {
                                                const itemKey = item.id || `vacancy-${item.unit_id}`;
                                                return sum + (allocations[cost.id]?.[itemKey] || 0);
                                            }, 0);

                                            return (
                                                <div key={unitId} className="border border-slate-200 rounded-lg">
                                                    <button
                                                        onClick={() => toggleUnit(cost.id, unitId)}
                                                        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {isUnitExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                            <Home className="w-4 h-4 text-slate-400" />
                                                            <span className="font-medium text-slate-800">
                                                                {group.unit.unit_number}
                                                            </span>
                                                            <span className="text-sm text-slate-500">
                                                                ({group.unit.sqm} m²)
                                                            </span>
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-600">
                                                            Zugewiesen: €{unitTotal.toFixed(2)}
                                                        </span>
                                                    </button>

                                                    {isUnitExpanded && (
                                                        <div className="px-3 pb-3 space-y-2">
                                                            {group.contracts.map(contract => {
                                                                const tenant = getTenant(contract.tenant_id);
                                                                const secondTenant = contract.second_tenant_id ? getTenant(contract.second_tenant_id) : null;

                                                                return (
                                                                    <div key={contract.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                                        <div className="flex items-center gap-2 flex-1">
                                                                            <User className="w-4 h-4 text-slate-400" />
                                                                            <div>
                                                                                <p className="font-medium text-slate-800 text-sm">
                                                                                    {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt'}
                                                                                    {secondTenant && ` & ${secondTenant.first_name} ${secondTenant.last_name}`}
                                                                                </p>
                                                                                <p className="text-xs text-slate-500">
                                                                                    {contract.effective_start} - {contract.effective_end}
                                                                                    {contract.number_of_persons && ` • ${contract.number_of_persons} Personen`}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <Label className="text-sm">€</Label>
                                                                            <Input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={allocations[cost.id]?.[contract.id] || 0}
                                                                                onChange={(e) => updateAllocation(cost.id, contract.id, e.target.value)}
                                                                                className="w-32"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}

                                                            {group.vacancies.map(vacancy => {
                                                                const itemKey = `vacancy-${vacancy.unit_id}`;

                                                                return (
                                                                    <div key={vacancy.id || itemKey} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                                                                        <div className="flex items-center gap-2 flex-1">
                                                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                                                            <div>
                                                                                <p className="font-medium text-amber-800 text-sm">Leerstand</p>
                                                                                <p className="text-xs text-amber-700">
                                                                                    {vacancy.vacancy_start} - {vacancy.vacancy_end}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <Label className="text-sm">€</Label>
                                                                            <Input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={allocations[cost.id]?.[itemKey] || 0}
                                                                                onChange={(e) => updateAllocation(cost.id, itemKey, e.target.value)}
                                                                                className="w-32"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack}>
                    Zurück
                </Button>
                <Button 
                    onClick={handleNext}
                    disabled={allCosts.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    Berechnen & Weiter
                </Button>
            </div>
        </div>
    );
}