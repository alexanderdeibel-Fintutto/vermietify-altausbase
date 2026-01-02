import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { User, Home, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Step4DirectCosts({ data, onNext, onBack, onDataChange }) {
    const [directCosts, setDirectCosts] = useState({});

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const directCostCategories = Object.values(data.costs || {})
        .filter(c => c.selected && c.distribution_key === 'direkt');

    useEffect(() => {
        const initial = {};
        directCostCategories.forEach(category => {
            initial[category.costType.id] = {};
            [...data.contracts, ...data.vacancies].forEach(item => {
                initial[category.costType.id][item.id || item.unit_id] = 0;
            });
        });
        setDirectCosts(initial);
    }, []);

    const updateAllocation = (costTypeId, itemId, amount) => {
        setDirectCosts(prev => ({
            ...prev,
            [costTypeId]: {
                ...prev[costTypeId],
                [itemId]: parseFloat(amount) || 0
            }
        }));
    };

    const handleCalculate = () => {
        // Validate that all direct costs are fully allocated
        for (const category of directCostCategories) {
            const allocated = Object.values(directCosts[category.costType.id] || {})
                .reduce((sum, val) => sum + val, 0);
            
            if (Math.abs(allocated - category.total) > 0.01) {
                toast.error(`Kosten für "${category.costType.sub_category}" sind nicht vollständig zugewiesen`);
                return;
            }
        }

        onDataChange({ directCosts });
        onNext();
    };

    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);
    const getUnit = (unitId) => units.find(u => u.id === unitId);

    if (directCostCategories.length === 0) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <p className="text-slate-600">Keine direkt zuzuordnenden Kosten ausgewählt</p>
                </div>
                <div className="flex justify-between">
                    <Button variant="outline" onClick={onBack}>
                        Zurück
                    </Button>
                    <Button 
                        onClick={() => onNext()}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        Weiter
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Direkte Kosten zuordnen</h3>
                <p className="text-sm text-slate-600">
                    Weisen Sie die direkten Kosten den einzelnen Mietverträgen und Leerständen zu
                </p>
            </div>

            {directCostCategories.map(category => {
                const allocated = Object.values(directCosts[category.costType.id] || {})
                    .reduce((sum, val) => sum + val, 0);
                const remaining = category.total - allocated;

                return (
                    <Card key={category.costType.id} className="p-4">
                        <div className="mb-4">
                            <h4 className="font-semibold text-slate-800">{category.costType.sub_category}</h4>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-slate-600">
                                    Gesamt: <span className="font-semibold">€{category.total.toFixed(2)}</span>
                                </span>
                                <span className="text-sm text-slate-600">
                                    Zugewiesen: <span className="font-semibold">€{allocated.toFixed(2)}</span>
                                </span>
                                <span className={`text-sm font-semibold ${Math.abs(remaining) < 0.01 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    Verbleibend: €{remaining.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {data.contracts.map(contract => {
                                const tenant = getTenant(contract.tenant_id);
                                const unit = getUnit(contract.unit_id);

                                return (
                                    <div key={contract.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <p className="font-medium text-slate-800">
                                                    {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt'}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {unit?.unit_number} • {contract.effective_start} - {contract.effective_end}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-sm">€</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={directCosts[category.costType.id]?.[contract.id] || 0}
                                                onChange={(e) => updateAllocation(category.costType.id, contract.id, e.target.value)}
                                                className="w-32"
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            {data.vacancies.map(vacancy => {
                                const unit = getUnit(vacancy.unit_id);

                                return (
                                    <div key={vacancy.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                            <div>
                                                <p className="font-medium text-amber-800">Leerstand</p>
                                                <p className="text-xs text-amber-700">
                                                    {unit?.unit_number} • {vacancy.vacancy_start} - {vacancy.vacancy_end}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-sm">€</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={directCosts[category.costType.id]?.[vacancy.id] || 0}
                                                onChange={(e) => updateAllocation(category.costType.id, vacancy.id, e.target.value)}
                                                className="w-32"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                );
            })}

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack}>
                    Zurück
                </Button>
                <Button 
                    onClick={handleCalculate}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    Berechnen & Weiter
                </Button>
            </div>
        </div>
    );
}