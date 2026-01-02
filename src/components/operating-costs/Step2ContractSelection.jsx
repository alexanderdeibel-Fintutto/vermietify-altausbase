import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Users, Home, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { parseISO, isWithinInterval, eachDayOfInterval, differenceInDays, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Step2ContractSelection({ data, onNext, onBack, onDataChange }) {
    const [contracts, setContracts] = useState([]);
    const [vacancies, setVacancies] = useState([]);

    const { data: allContracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const selectedUnits = units.filter(u => data.selected_units.includes(u.id));
    const periodStart = parseISO(data.period_start);
    const periodEnd = parseISO(data.period_end);

    useEffect(() => {
        if (selectedUnits.length > 0 && data.period_start && data.period_end) {
            calculateContractsAndVacancies();
        }
    }, [data.selected_units, data.period_start, data.period_end, allContracts]);

    const calculateContractsAndVacancies = () => {
        const relevantContracts = allContracts.filter(contract => {
            if (!data.selected_units.includes(contract.unit_id)) return false;
            
            const contractStart = parseISO(contract.start_date);
            const contractEnd = contract.end_date && !contract.is_unlimited ? parseISO(contract.end_date) : periodEnd;
            
            return (
                (contractStart <= periodEnd && contractEnd >= periodStart)
            );
        });

        const contractsWithPersons = relevantContracts.map(contract => ({
            ...contract,
            number_of_persons: contract.number_of_persons || 1,
            effective_start: contract.start_date > data.period_start ? contract.start_date : data.period_start,
            effective_end: (contract.end_date && contract.end_date < data.period_end) ? contract.end_date : data.period_end
        }));

        setContracts(contractsWithPersons);

        // Calculate vacancies
        const calculatedVacancies = [];
        
        selectedUnits.forEach(unit => {
            const unitContracts = contractsWithPersons
                .filter(c => c.unit_id === unit.id)
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

            const allDays = eachDayOfInterval({ start: periodStart, end: periodEnd });
            const coveredDays = new Set();

            unitContracts.forEach(contract => {
                const contractStart = parseISO(contract.start_date);
                const contractEnd = contract.end_date && !contract.is_unlimited ? parseISO(contract.end_date) : periodEnd;
                
                const days = eachDayOfInterval({ 
                    start: contractStart > periodStart ? contractStart : periodStart,
                    end: contractEnd < periodEnd ? contractEnd : periodEnd
                });
                
                days.forEach(day => coveredDays.add(day.toISOString()));
            });

            // Find vacancy periods
            let vacancyStart = null;
            allDays.forEach((day, index) => {
                const isVacant = !coveredDays.has(day.toISOString());
                
                if (isVacant && !vacancyStart) {
                    vacancyStart = day;
                } else if (!isVacant && vacancyStart) {
                    calculatedVacancies.push({
                        id: `vacancy-${unit.id}-${vacancyStart.toISOString()}`,
                        unit_id: unit.id,
                        vacancy_start: format(vacancyStart, 'yyyy-MM-dd'),
                        vacancy_end: format(allDays[index - 1], 'yyyy-MM-dd'),
                        is_vacancy: true
                    });
                    vacancyStart = null;
                }
            });

            if (vacancyStart) {
                calculatedVacancies.push({
                    id: `vacancy-${unit.id}-${vacancyStart.toISOString()}`,
                    unit_id: unit.id,
                    vacancy_start: format(vacancyStart, 'yyyy-MM-dd'),
                    vacancy_end: format(periodEnd, 'yyyy-MM-dd'),
                    is_vacancy: true
                });
            }
        });

        setVacancies(calculatedVacancies);
    };

    const updatePersonCount = (contractId, count) => {
        setContracts(prev => prev.map(c => 
            c.id === contractId ? { ...c, number_of_persons: parseInt(count) || 1 } : c
        ));
    };

    const handleNext = () => {
        // Check for overlapping contracts
        const unitsWithOverlap = selectedUnits.filter(unit => hasOverlap(unit.id));
        if (unitsWithOverlap.length > 0) {
            const unitNames = unitsWithOverlap.map(u => u.unit_number).join(', ');
            toast.error(`Doppelbelegung durch mehrere Mietverträge erkannt für: ${unitNames}. Bitte korrigieren Sie die Verträge.`);
            return;
        }

        // Check coverage
        const allCovered = selectedUnits.every(unit => {
            const unitContracts = contracts.filter(c => c.unit_id === unit.id);
            const unitVacancies = vacancies.filter(v => v.unit_id === unit.id);
            
            const totalDays = differenceInDays(periodEnd, periodStart) + 1;
            
            let coveredDays = 0;
            unitContracts.forEach(contract => {
                const start = parseISO(contract.effective_start);
                const end = parseISO(contract.effective_end);
                coveredDays += differenceInDays(end, start) + 1;
            });
            
            unitVacancies.forEach(vacancy => {
                const start = parseISO(vacancy.vacancy_start);
                const end = parseISO(vacancy.vacancy_end);
                coveredDays += differenceInDays(end, start) + 1;
            });

            return coveredDays >= totalDays;
        });

        if (!allCovered) {
            toast.error('Nicht alle Wohneinheiten sind vollständig abgedeckt');
            return;
        }

        onDataChange({ contracts, vacancies });
        onNext();
    };

    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);
    const getUnit = (unitId) => units.find(u => u.id === unitId);

    const hasOverlap = (unitId) => {
        const unitContracts = contracts.filter(c => c.unit_id === unitId);
        
        for (let i = 0; i < unitContracts.length; i++) {
            for (let j = i + 1; j < unitContracts.length; j++) {
                const contract1Start = parseISO(unitContracts[i].effective_start);
                const contract1End = parseISO(unitContracts[i].effective_end);
                const contract2Start = parseISO(unitContracts[j].effective_start);
                const contract2End = parseISO(unitContracts[j].effective_end);
                
                if (contract1Start <= contract2End && contract2Start <= contract1End) {
                    return true;
                }
            }
        }
        return false;
    };

    const isCovered = (unitId) => {
        const unitContracts = contracts.filter(c => c.unit_id === unitId);
        const unitVacancies = vacancies.filter(v => v.unit_id === unitId);
        
        const totalDays = differenceInDays(periodEnd, periodStart) + 1;
        
        let coveredDays = 0;
        unitContracts.forEach(contract => {
            const start = parseISO(contract.effective_start);
            const end = parseISO(contract.effective_end);
            coveredDays += differenceInDays(end, start) + 1;
        });
        
        unitVacancies.forEach(vacancy => {
            const start = parseISO(vacancy.vacancy_start);
            const end = parseISO(vacancy.vacancy_end);
            coveredDays += differenceInDays(end, start) + 1;
        });

        return coveredDays >= totalDays;
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Mietverträge & Leerstände</h3>
                <p className="text-sm text-slate-600">
                    Überprüfen Sie die Mietverträge und Leerstände für den Abrechnungszeitraum
                </p>
            </div>

            {selectedUnits.map(unit => {
                const unitContracts = contracts.filter(c => c.unit_id === unit.id);
                const unitVacancies = vacancies.filter(v => v.unit_id === unit.id);
                const covered = isCovered(unit.id);
                const overlap = hasOverlap(unit.id);

                return (
                    <Card key={unit.id} className="p-4 border-2" style={{ borderColor: overlap ? '#ef4444' : covered ? '#10b981' : '#ef4444' }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Home className="w-5 h-5 text-slate-400" />
                                <h4 className="font-semibold text-slate-800">{unit.unit_number}</h4>
                                <span className="text-sm text-slate-500">({unit.sqm} m²)</span>
                            </div>
                            {overlap ? (
                                <Badge className="bg-red-100 text-red-700">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Doppelbelegung erkannt!
                                </Badge>
                            ) : covered ? (
                                <Badge className="bg-emerald-100 text-emerald-700">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Vollständig abgedeckt
                                </Badge>
                            ) : (
                                <Badge className="bg-red-100 text-red-700">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Nicht vollständig abgedeckt
                                </Badge>
                            )}
                        </div>

                        <div className="space-y-3">
                            {unitContracts.map(contract => {
                                const tenant = getTenant(contract.tenant_id);
                                const secondTenant = contract.second_tenant_id ? getTenant(contract.second_tenant_id) : null;

                                return (
                                    <div key={contract.id} className="p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {secondTenant ? <Users className="w-4 h-4 text-slate-400" /> : <User className="w-4 h-4 text-slate-400" />}
                                                <span className="font-medium text-slate-800">
                                                    {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt'}
                                                    {secondTenant && ` & ${secondTenant.first_name} ${secondTenant.last_name}`}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-600 mb-2">
                                            Zeitraum: {contract.effective_start} bis {contract.effective_end}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs">Anzahl Personen:</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={contract.number_of_persons}
                                                onChange={(e) => updatePersonCount(contract.id, e.target.value)}
                                                className="w-20 h-8"
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            {unitVacancies.map(vacancy => (
                                <div key={vacancy.id} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                        <span className="font-medium text-amber-800">Leerstand</span>
                                    </div>
                                    <div className="text-sm text-amber-700">
                                        {vacancy.vacancy_start} bis {vacancy.vacancy_end}
                                    </div>
                                </div>
                            ))}

                            {unitContracts.length === 0 && unitVacancies.length === 0 && (
                                <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700">
                                    Keine Mietverträge oder Leerstände für diesen Zeitraum gefunden
                                </div>
                            )}
                        </div>
                    </Card>
                );
            })}

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack}>
                    Zurück
                </Button>
                <Button 
                    onClick={handleNext}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    Weiter
                </Button>
            </div>
        </div>
    );
}