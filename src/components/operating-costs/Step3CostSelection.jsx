import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function Step3CostSelection({ data, onNext, onBack, onDataChange }) {
    const [costs, setCosts] = useState({});
    const [expandedCategories, setExpandedCategories] = useState(new Set());
    const [addingManualCost, setAddingManualCost] = useState(null);
    const [manualCostForm, setManualCostForm] = useState({ description: '', amount: '', date: data.period_start || '' });

    const { data: costTypes = [] } = useQuery({
        queryKey: ['cost-types'],
        queryFn: () => base44.entities.CostType.list()
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const { data: financialItems = [] } = useQuery({
        queryKey: ['financial-items'],
        queryFn: () => base44.entities.FinancialItem.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const operatingCostTypes = costTypes.filter(ct => ct.distributable);

    // Also get invoices marked as operating cost relevant with non-distributable cost types
    const operatingCostInvoices = invoices.filter(inv => 
        inv.operating_cost_relevant && 
        inv.invoice_date >= data.period_start && 
        inv.invoice_date <= data.period_end
    );

    // Get unique cost types from operating cost invoices
    const additionalCostTypes = costTypes.filter(ct => 
        !ct.distributable && 
        operatingCostInvoices.some(inv => inv.cost_type_id === ct.id)
    );

    const allRelevantCostTypes = [...operatingCostTypes, ...additionalCostTypes];

    useEffect(() => {
        const initialCosts = {};
        
        allRelevantCostTypes.forEach(costType => {
            // Get relevant invoices
            const relevantInvoices = invoices.filter(inv => {
                if (inv.cost_type_id !== costType.id) return false;
                if (!inv.invoice_date) return false;
                if (inv.invoice_date < data.period_start || inv.invoice_date > data.period_end) return false;
                
                // Skip if unit doesn't match selected units
                if (inv.unit_id) {
                    const unit = units.find(u => u.id === inv.unit_id);
                    if (unit && !data.selected_units.includes(unit.id)) return false;
                }
                
                // Skip if building doesn't match (only if building is set on invoice)
                if (inv.building_id && data.building_id && inv.building_id !== data.building_id) return false;
                
                return true;
            });

            // Get relevant financial items (payables with cost_type_id)
            const relevantFinancialItems = financialItems.filter(item => {
                if (item.type !== 'payable') return false;
                if (item.cost_type_id !== costType.id) return false;
                if (!item.due_date) return false;
                if (item.due_date < data.period_start || item.due_date > data.period_end) return false;
                
                // Skip if unit doesn't match selected units
                if (item.related_to_unit_id) {
                    const unit = units.find(u => u.id === item.related_to_unit_id);
                    if (unit && !data.selected_units.includes(unit.id)) return false;
                }
                
                return true;
            }).map(item => ({
                id: item.id,
                description: item.description || 'Kosten',
                invoice_date: item.due_date,
                recipient: item.reference || '-',
                amount: item.expected_amount || 0,
                isFinancialItem: true
            }));

            // Combine both
            const allEntries = [...relevantInvoices, ...relevantFinancialItems];

            initialCosts[costType.id] = {
                costType,
                selected: false,
                distribution_key: costType.distribution_key || 'qm',
                invoices: allEntries,
                selectedInvoices: [],
                total: 0
            };
        });

        setCosts(initialCosts);
    }, [allRelevantCostTypes, invoices, financialItems, data, units]);

    const toggleCategory = (costTypeId) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(costTypeId)) {
                newSet.delete(costTypeId);
            } else {
                newSet.add(costTypeId);
            }
            return newSet;
        });
    };

    const toggleCategorySelection = (costTypeId) => {
        setCosts(prev => {
            const costData = prev[costTypeId];
            const willBeSelected = !costData.selected;
            const newSelectedInvoices = willBeSelected ? costData.invoices.map(inv => inv.id) : [];
            const newTotal = willBeSelected 
                ? costData.invoices.reduce((sum, inv) => sum + inv.amount, 0) 
                : 0;

            return {
                ...prev,
                [costTypeId]: {
                    ...costData,
                    selected: willBeSelected,
                    selectedInvoices: newSelectedInvoices,
                    total: newTotal
                }
            };
        });
    };

    const toggleInvoice = (costTypeId, invoiceId) => {
        setCosts(prev => {
            const costData = prev[costTypeId];
            const selectedInvoices = costData.selectedInvoices.includes(invoiceId)
                ? costData.selectedInvoices.filter(id => id !== invoiceId)
                : [...costData.selectedInvoices, invoiceId];

            const total = costData.invoices
                .filter(inv => selectedInvoices.includes(inv.id))
                .reduce((sum, inv) => sum + inv.amount, 0);

            return {
                ...prev,
                [costTypeId]: {
                    ...costData,
                    selectedInvoices,
                    total,
                    selected: selectedInvoices.length > 0
                }
            };
        });
    };

    const updateDistributionKey = (costTypeId, key) => {
        setCosts(prev => ({
            ...prev,
            [costTypeId]: {
                ...prev[costTypeId],
                distribution_key: key
            }
        }));
    };

    const handleAddManualCost = (costTypeId) => {
        if (!manualCostForm.description || !manualCostForm.amount) {
            toast.error('Bitte Beschreibung und Betrag eingeben');
            return;
        }

        const manualEntry = {
            id: `manual-${Date.now()}`,
            description: manualCostForm.description,
            invoice_date: manualCostForm.date,
            recipient: 'Manuelle Buchung',
            amount: parseFloat(manualCostForm.amount),
            isManual: true
        };

        setCosts(prev => {
            const costData = prev[costTypeId];
            const newInvoices = [...costData.invoices, manualEntry];
            const newSelectedInvoices = [...costData.selectedInvoices, manualEntry.id];
            const newTotal = newInvoices
                .filter(inv => newSelectedInvoices.includes(inv.id))
                .reduce((sum, inv) => sum + inv.amount, 0);

            return {
                ...prev,
                [costTypeId]: {
                    ...costData,
                    invoices: newInvoices,
                    selectedInvoices: newSelectedInvoices,
                    total: newTotal,
                    selected: true
                }
            };
        });

        setAddingManualCost(null);
        setManualCostForm({ description: '', amount: '', date: data.period_start || '' });
        toast.success('Buchung hinzugefügt');
    };

    const handleNext = () => {
        const selectedCosts = Object.values(costs).filter(c => c.selected);
        
        if (selectedCosts.length === 0) {
            toast.error('Bitte wählen Sie mindestens eine Kostenkategorie aus');
            return;
        }

        onDataChange({ costs });
        onNext();
    };

    const groupedCostTypes = allRelevantCostTypes.reduce((acc, ct) => {
        if (!acc[ct.main_category]) {
            acc[ct.main_category] = [];
        }
        acc[ct.main_category].push(ct);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Kosten auswählen</h3>
                <p className="text-sm text-slate-600">
                    Wählen Sie die Kostenkategorien und deren Buchungen für die Abrechnung aus
                </p>
            </div>

            <div className="space-y-4">
                {Object.entries(groupedCostTypes).map(([mainCategory, types]) => (
                    <div key={mainCategory}>
                        <h4 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">
                            {mainCategory}
                        </h4>
                        <div className="space-y-2">
                            {types.map(costType => {
                                const costData = costs[costType.id];
                                if (!costData) return null;

                                const isExpanded = expandedCategories.has(costType.id);
                                const categoryTotal = costData.invoices.reduce((sum, inv) => sum + inv.amount, 0);

                                return (
                                    <Card key={costType.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                <Checkbox
                                                    checked={costData.selected}
                                                    onCheckedChange={() => toggleCategorySelection(costType.id)}
                                                />
                                                <button
                                                    onClick={() => toggleCategory(costType.id)}
                                                    className="flex items-center gap-2 flex-1 text-left"
                                                >
                                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                    <span className="font-medium text-slate-800">{costType.sub_category}</span>
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-slate-600">
                                                    {costData.invoices.length} Buchungen • €{categoryTotal.toFixed(2)}
                                                </span>
                                                {costData.selected && (
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs">Schlüssel:</Label>
                                                        <Select 
                                                            value={costData.distribution_key} 
                                                            onValueChange={(value) => updateDistributionKey(costType.id, value)}
                                                        >
                                                            <SelectTrigger className="w-32 h-8">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="qm">QM</SelectItem>
                                                                <SelectItem value="Personen">Personen</SelectItem>
                                                                <SelectItem value="Einheit">Einheit</SelectItem>
                                                                <SelectItem value="direkt">Direkt</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="mt-4 space-y-2 pl-9">
                                                {costData.invoices.map(invoice => (
                                                    <div key={invoice.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                checked={costData.selectedInvoices.includes(invoice.id)}
                                                                onCheckedChange={() => toggleInvoice(costType.id, invoice.id)}
                                                            />
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800">
                                                                    {invoice.description}
                                                                    {invoice.isManual && (
                                                                        <Badge variant="outline" className="ml-2 text-xs">Manuell</Badge>
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {invoice.invoice_date} • {invoice.recipient}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-800">
                                                            €{invoice.amount.toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                                
                                                {addingManualCost === costType.id ? (
                                                    <div className="p-3 bg-blue-50 rounded border border-blue-200 space-y-2">
                                                        <Input
                                                            placeholder="Beschreibung"
                                                            value={manualCostForm.description}
                                                            onChange={(e) => setManualCostForm({ ...manualCostForm, description: e.target.value })}
                                                        />
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="Betrag"
                                                                value={manualCostForm.amount}
                                                                onChange={(e) => setManualCostForm({ ...manualCostForm, amount: e.target.value })}
                                                            />
                                                            <Input
                                                                type="date"
                                                                value={manualCostForm.date}
                                                                onChange={(e) => setManualCostForm({ ...manualCostForm, date: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button 
                                                                size="sm" 
                                                                onClick={() => handleAddManualCost(costType.id)}
                                                                className="bg-emerald-600 hover:bg-emerald-700"
                                                            >
                                                                Hinzufügen
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setAddingManualCost(null);
                                                                    setManualCostForm({ description: '', amount: '', date: data.period_start || '' });
                                                                }}
                                                            >
                                                                Abbrechen
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setAddingManualCost(costType.id)}
                                                        className="w-full"
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Buchung hinzufügen
                                                    </Button>
                                                )}
                                            </div>
                                        )}

                                        {costData.selected && (
                                            <div className="mt-3 pt-3 border-t border-slate-200">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="font-medium text-slate-700">
                                                        Gewählte Summe ({costData.selectedInvoices.length} Buchungen):
                                                    </span>
                                                    <span className="text-lg font-semibold text-emerald-600">
                                                        €{costData.total.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

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