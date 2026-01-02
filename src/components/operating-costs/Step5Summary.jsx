import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { toast } from 'sonner';

export default function Step5Summary({ data, onBack, onSuccess, onClose }) {
    const [results, setResults] = useState([]);
    const [expandedItems, setExpandedItems] = useState(new Set());
    const queryClient = useQueryClient();

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: financialItems = [] } = useQuery({
        queryKey: ['financial-items'],
        queryFn: () => base44.entities.FinancialItem.list()
    });

    useEffect(() => {
        calculateDistribution();
    }, []);

    const calculateDistribution = () => {
        const periodStart = parseISO(data.period_start);
        const periodEnd = parseISO(data.period_end);
        const totalDays = differenceInDays(periodEnd, periodStart) + 1;

        const allItems = [...data.contracts, ...data.vacancies];
        const calculatedResults = [];

        allItems.forEach(item => {
            const unit = units.find(u => u.id === (item.unit_id || item.id));
            if (!unit) return;

            const itemStart = parseISO(item.effective_start || item.vacancy_start || data.period_start);
            const itemEnd = parseISO(item.effective_end || item.vacancy_end || data.period_end);
            const itemDays = differenceInDays(itemEnd, itemStart) + 1;
            const dayFactor = itemDays / totalDays;

            let totalCost = 0;
            const costDetails = [];

            // Process costs from Step 3 (with distribution keys)
            Object.values(data.costs || {}).forEach(costData => {
                if (!costData.selected) return;

                let itemCost = 0;
                const itemKey = item.is_vacancy ? `vacancy-${item.unit_id}` : item.id;

                if (costData.distribution_key === 'direkt') {
                    // Direct costs from Step 3 that were allocated in Step 4
                    itemCost = data.directCosts?.[costData.costType.id]?.[itemKey] || 0;
                } else if (costData.distribution_key === 'qm') {
                    const totalSqm = units
                        .filter(u => data.selected_units.includes(u.id))
                        .reduce((sum, u) => sum + (u.sqm || 0), 0);
                    itemCost = (costData.total * (unit.sqm / totalSqm)) * dayFactor;
                } else if (costData.distribution_key === 'Personen') {
                    // Personen costs are 0 for vacancies
                    if (!item.is_vacancy) {
                        const totalPersons = data.contracts.reduce((sum, i) => sum + (i.number_of_persons || 0), 0);
                        if (totalPersons > 0) {
                            itemCost = (costData.total * ((item.number_of_persons || 0) / totalPersons)) * dayFactor;
                        }
                    }
                } else if (costData.distribution_key === 'Einheit') {
                    const totalUnits = allItems.length;
                    itemCost = (costData.total / totalUnits) * dayFactor;
                }

                if (itemCost > 0) {
                    costDetails.push({
                        category: costData.costType.sub_category,
                        amount: itemCost,
                        distribution_key: costData.distribution_key
                    });
                    totalCost += itemCost;
                }
            });

            // Process manual costs from Step 4
            (data.manualCosts || []).forEach(manualCost => {
                const itemKey = item.is_vacancy ? `vacancy-${item.unit_id}` : item.id;
                const itemCost = data.directCosts?.[manualCost.id]?.[itemKey] || 0;

                if (itemCost > 0) {
                    costDetails.push({
                        category: manualCost.name,
                        amount: itemCost,
                        distribution_key: 'direkt'
                    });
                    totalCost += itemCost;
                }
            });

            // Calculate advance payments from financial items
            let advancePayments = 0;
            if (!item.is_vacancy && item.id) {
                const contractFinancialItems = financialItems.filter(fi => 
                    fi.related_to_contract_id === item.id &&
                    fi.payment_month >= data.period_start &&
                    fi.payment_month <= data.period_end &&
                    fi.type === 'receivable'
                );

                advancePayments = contractFinancialItems.reduce((sum, fi) => {
                    return sum + ((fi.amount || 0));
                }, 0);
            }

            const difference = totalCost - advancePayments;

            calculatedResults.push({
                ...item,
                unit,
                totalCost,
                costDetails,
                advancePayments,
                difference
            });
        });

        setResults(calculatedResults);
    };

    const createMutation = useMutation({
        mutationFn: async () => {
            const statement = await base44.entities.OperatingCostStatement.create({
                building_id: data.building_id,
                period_start: data.period_start,
                period_end: data.period_end,
                selected_units: data.selected_units,
                total_costs: results.reduce((sum, r) => sum + r.totalCost, 0),
                status: 'completed'
            });

            const items = results.map(result => ({
                statement_id: statement.id,
                contract_id: result.is_vacancy ? null : result.id,
                unit_id: result.unit_id,
                is_vacancy: result.is_vacancy || false,
                vacancy_start: result.vacancy_start,
                vacancy_end: result.vacancy_end,
                number_of_persons: result.number_of_persons,
                allocated_amount: result.totalCost,
                advance_payments: result.advancePayments,
                difference: result.difference
            }));

            await base44.entities.OperatingCostStatementItem.bulkCreate(items);

            return statement;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operating-cost-statements'] });
            toast.success('Betriebskostenabrechnung erstellt');
            onSuccess();
            onClose();
        },
        onError: (error) => {
            toast.error('Fehler beim Erstellen: ' + error.message);
        }
    });

    const toggleDetails = (itemId) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Zusammenfassung</h3>
                <p className="text-sm text-slate-600">
                    Übersicht der Betriebskostenverteilung für alle Mietverträge und Leerstände
                </p>
            </div>

            <div className="space-y-3">
                {results.map(result => {
                    const isExpanded = expandedItems.has(result.id || result.unit_id);
                    const tenant = result.tenant_id ? getTenant(result.tenant_id) : null;

                    return (
                        <Card key={result.id || result.unit_id} className="p-4">
                            <button
                                onClick={() => toggleDetails(result.id || result.unit_id)}
                                className="w-full"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {result.is_vacancy ? (
                                            <Home className="w-5 h-5 text-amber-600" />
                                        ) : (
                                            <User className="w-5 h-5 text-slate-400" />
                                        )}
                                        <div className="text-left">
                                            <p className="font-semibold text-slate-800">
                                                {result.is_vacancy ? 'Leerstand' : (tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt')}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {result.unit?.unit_number} • 
                                                {result.is_vacancy 
                                                    ? ` ${result.vacancy_start} - ${result.vacancy_end}`
                                                    : ` ${result.effective_start} - ${result.effective_end}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm text-slate-600">Betriebskosten</p>
                                            <p className="text-lg font-bold text-slate-800">
                                                €{result.totalCost.toFixed(2)}
                                            </p>
                                        </div>
                                        {!result.is_vacancy && (
                                            <>
                                                <div className="text-right">
                                                    <p className="text-sm text-slate-600">Vorauszahlungen</p>
                                                    <p className="text-lg font-semibold text-slate-700">
                                                        €{result.advancePayments.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-slate-600">Differenz</p>
                                                    <Badge className={result.difference <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                                        {result.difference <= 0 ? 'Guthaben' : 'Nachzahlung'}: €{Math.abs(result.difference).toFixed(2)}
                                                    </Badge>
                                                </div>
                                            </>
                                        )}
                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </div>
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <h5 className="font-semibold text-slate-700 mb-3">Kostenaufschlüsselung</h5>
                                    <div className="space-y-2">
                                        {result.costDetails.map((detail, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">{detail.category}</p>
                                                    <p className="text-xs text-slate-500">
                                                        Schlüssel: {detail.distribution_key}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-semibold text-slate-700">
                                                    €{detail.amount.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack}>
                    Zurück
                </Button>
                <Button 
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    {createMutation.isPending ? 'Erstelle...' : 'Abrechnung erstellen'}
                </Button>
            </div>
        </div>
    );
}