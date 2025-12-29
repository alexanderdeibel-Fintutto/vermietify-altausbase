import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Plus, Trash2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Building2, Calendar, CreditCard, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function TransactionAllocationDialog({ 
    transaction,
    onClose,
    onSuccess,
    availableCategories,
    categoryLabels,
    tenants,
    units,
    buildings,
    contracts,
    financialItems
}) {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedObjectId, setSelectedObjectId] = useState('');
    const [selectedContractId, setSelectedContractId] = useState('');
    const [allocations, setAllocations] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const isIncome = transaction.amount > 0;
    const selectedUnit = units.find(u => u.id === selectedObjectId);
    const actualUnitId = selectedUnit ? selectedObjectId : null;

    // Helper functions
    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);
    const getUnit = (unitId) => units.find(u => u.id === unitId);
    const getBuilding = (buildingId) => buildings.find(b => b.id === buildingId);

    // Smart contract suggestions based on transaction data
    const suggestedContracts = React.useMemo(() => {
        if (selectedCategory !== 'rent_income') return [];
        
        const activeContracts = contracts.filter(c => c.status === 'active');
        const scored = activeContracts.map(contract => {
            let score = 0;
            const tenant = getTenant(contract.tenant_id);
            const secondTenant = contract.second_tenant_id ? getTenant(contract.second_tenant_id) : null;
            
            // Match sender name with tenant names
            if (tenant && transaction.sender_receiver) {
                const senderLower = transaction.sender_receiver.toLowerCase();
                const firstNameMatch = tenant.first_name?.toLowerCase();
                const lastNameMatch = tenant.last_name?.toLowerCase();
                
                if (firstNameMatch && senderLower.includes(firstNameMatch)) score += 10;
                if (lastNameMatch && senderLower.includes(lastNameMatch)) score += 10;
                
                if (secondTenant) {
                    const secondFirstMatch = secondTenant.first_name?.toLowerCase();
                    const secondLastMatch = secondTenant.last_name?.toLowerCase();
                    if (secondFirstMatch && senderLower.includes(secondFirstMatch)) score += 10;
                    if (secondLastMatch && senderLower.includes(secondLastMatch)) score += 10;
                }
            }
            
            // Match amount with rent
            if (Math.abs(transaction.amount) === contract.total_rent) score += 20;
            else if (Math.abs(Math.abs(transaction.amount) - contract.total_rent) < 10) score += 10;
            
            // Match reference with unit
            const unit = getUnit(contract.unit_id);
            if (unit && transaction.reference?.includes(unit.unit_number)) score += 15;
            
            return { contract, score };
        });
        
        return scored.sort((a, b) => b.score - a.score).map(s => s.contract);
    }, [selectedCategory, contracts, transaction]);

    // Filter contracts based on selection or use suggestions
    const filteredContracts = React.useMemo(() => {
        if (selectedCategory === 'rent_income') {
            if (actualUnitId) {
                return contracts.filter(c => c.unit_id === actualUnitId && c.status === 'active');
            }
            return suggestedContracts;
        }
        return [];
    }, [actualUnitId, contracts, selectedCategory, suggestedContracts]);

    // Filter financial items based on contract - only up to current date
    const filteredFinancialItems = React.useMemo(() => {
        if (selectedCategory === 'rent_income' && selectedContractId) {
            const today = format(new Date(), 'yyyy-MM');
            const items = financialItems.filter(item => 
                item.related_to_contract_id === selectedContractId && 
                (item.status === 'pending' || item.status === 'partial' || item.status === 'overdue') &&
                item.payment_month && item.payment_month <= today
            );
            
            // Sort by relevance to transaction date
            const transactionDate = transaction.transaction_date;
            return items.sort((a, b) => {
                // Calculate date difference from transaction date
                const diffA = transactionDate && a.payment_month 
                    ? Math.abs(new Date(transactionDate).getTime() - new Date(a.payment_month + '-01').getTime())
                    : Infinity;
                const diffB = transactionDate && b.payment_month
                    ? Math.abs(new Date(transactionDate).getTime() - new Date(b.payment_month + '-01').getTime())
                    : Infinity;
                
                // Closer dates first, then by payment_month descending
                if (diffA !== diffB) return diffA - diffB;
                return (b.payment_month || '').localeCompare(a.payment_month || '');
            });
        }
        return [];
    }, [selectedContractId, financialItems, selectedCategory, transaction.transaction_date]);

    // Calculate totals
    const transactionAmount = Math.abs(transaction.amount);
    const totalAllocated = allocations.reduce((sum, alloc) => sum + (parseFloat(alloc.amount) || 0), 0);
    const remaining = transactionAmount - totalAllocated;

    const addAllocation = () => {
        setAllocations([...allocations, { financialItemId: '', amount: '' }]);
    };

    const removeAllocation = (index) => {
        setAllocations(allocations.filter((_, i) => i !== index));
    };

    const updateAllocation = (index, field, value) => {
        const updated = [...allocations];
        updated[index][field] = value;
        setAllocations(updated);
    };

    const handleQuickAllocate = () => {
        const openItems = filteredFinancialItems.slice().sort((a, b) => 
            new Date(a.payment_month || a.due_date) - new Date(b.payment_month || b.due_date)
        );

        const newAllocations = [];
        let remainingAmount = transactionAmount;

        for (const item of openItems) {
            if (remainingAmount <= 0) break;

            const openAmount = (item.expected_amount || 0) - (item.amount || 0);
            const allocateAmount = Math.min(remainingAmount, openAmount);

            if (allocateAmount > 0) {
                newAllocations.push({
                    financialItemId: item.id,
                    amount: allocateAmount.toFixed(2)
                });
                remainingAmount -= allocateAmount;
            }
        }

        setAllocations(newAllocations);
    };

    const handleSubmit = async () => {
        if (!selectedCategory) {
            toast.error('Bitte wählen Sie eine Kategorie');
            return;
        }

        setIsProcessing(true);
        try {
            if (selectedCategory === 'rent_income' && allocations.length > 0) {
                // Use backend function for financial item allocation
                const financialItemAllocations = allocations
                    .filter(a => a.financialItemId && parseFloat(a.amount) > 0)
                    .map(a => ({
                        financialItemId: a.financialItemId,
                        amount: parseFloat(a.amount)
                    }));

                if (financialItemAllocations.length === 0) {
                    toast.error('Bitte ordnen Sie mindestens eine Forderung zu');
                    setIsProcessing(false);
                    return;
                }

                await base44.functions.invoke('reconcileTransactionWithFinancialItems', {
                    transactionId: transaction.id,
                    financialItemAllocations,
                    category: selectedCategory,
                    unitId: actualUnitId,
                    contractId: selectedContractId
                });

                toast.success('Transaktion zugeordnet');
            } else {
                // Simple categorization without payment
                await base44.entities.BankTransaction.update(transaction.id, {
                    is_categorized: true,
                    category: selectedCategory,
                    unit_id: actualUnitId || null,
                    contract_id: selectedContractId || null
                });

                toast.success('Transaktion kategorisiert');
            }

            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Fehler bei der Zuordnung');
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-slate-800">
                        Transaktion zuordnen
                    </h3>
                </div>

                {/* Transaction Info */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 mb-6 border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-slate-500" />
                                <p className="font-semibold text-slate-800">{transaction.sender_receiver}</p>
                            </div>
                            <p className="text-sm text-slate-600 mb-1">{transaction.description}</p>
                            {transaction.reference && (
                                <p className="text-xs text-slate-500 mb-1">Ref: {transaction.reference}</p>
                            )}
                            {transaction.iban && (
                                <p className="text-xs text-slate-500 font-mono">IBAN: {transaction.iban}</p>
                            )}
                        </div>
                        <p className={`text-3xl font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isIncome ? '+' : ''}{transaction.amount?.toFixed(2)} €
                        </p>
                    </div>
                    <div className="flex gap-4 text-sm pt-3 border-t border-slate-200">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">
                                Buchung: {transaction.transaction_date ? (() => {
                                    try {
                                        return format(parseISO(transaction.transaction_date), 'dd.MM.yyyy', { locale: de });
                                    } catch {
                                        return transaction.transaction_date;
                                    }
                                })() : '-'}
                            </span>
                        </div>
                        {transaction.value_date && transaction.value_date !== transaction.transaction_date && (
                            <div className="flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-600">
                                    Wertstellung: {(() => {
                                        try {
                                            return format(parseISO(transaction.value_date), 'dd.MM.yyyy', { locale: de });
                                        } catch {
                                            return transaction.value_date;
                                        }
                                    })()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 1: Category */}
                <div className="mb-6">
                    <Label className="text-sm font-medium mb-2">1. Kategorie wählen *</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                            <SelectValue placeholder="Kategorie auswählen..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableCategories.map(cat => (
                                <SelectItem key={cat} value={cat}>
                                    {categoryLabels[cat] || cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Step 2: Object/Unit */}
                <div className="mb-6">
                    <Label className="text-sm font-medium mb-2">
                        2. Mietobjekt wählen {selectedCategory !== 'rent_income' ? '(optional)' : ''}
                    </Label>
                    <Select value={selectedObjectId} onValueChange={(value) => {
                        setSelectedObjectId(value);
                        setSelectedContractId('');
                        setAllocations([]);
                    }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Objekt/Wohnung auswählen..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                            {buildings.flatMap(building => {
                                const buildingUnits = units.filter(u => u.building_id === building.id);
                                return [
                                    <SelectItem key={building.id} value={building.id}>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-slate-400" />
                                            <span className="font-semibold">{building.name}</span>
                                        </div>
                                    </SelectItem>,
                                    ...buildingUnits.map(unit => (
                                        <SelectItem key={unit.id} value={unit.id}>
                                            <div className="flex items-center gap-2 pl-6">
                                                <span className="text-slate-400">└</span>
                                                <span>{unit.unit_number}</span>
                                                <span className="text-xs text-slate-400">({unit.sqm}m²)</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                ];
                            })}
                        </SelectContent>
                    </Select>
                </div>

                {/* Step 2a: Contract (for rent_income) */}
                {selectedCategory === 'rent_income' && filteredContracts.length > 0 && (
                    <div className="mb-6">
                        <Label className="text-sm font-medium mb-2">
                            3. Mietvertrag wählen *
                            {!actualUnitId && suggestedContracts.length > 0 && (
                                <span className="ml-2 text-xs text-blue-600 font-normal">
                                    (Nach Relevanz sortiert)
                                </span>
                            )}
                        </Label>
                        <Select value={selectedContractId} onValueChange={(value) => {
                            setSelectedContractId(value);
                            setAllocations([]);
                            // Automatisch das Mietobjekt setzen
                            const contract = contracts.find(c => c.id === value);
                            if (contract?.unit_id) {
                                setSelectedObjectId(contract.unit_id);
                            }
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Vertrag auswählen..." />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredContracts.map((contract, idx) => {
                                    const tenant = getTenant(contract.tenant_id);
                                    const secondTenant = contract.second_tenant_id ? getTenant(contract.second_tenant_id) : null;
                                    const unit = getUnit(contract.unit_id);
                                    const building = unit ? getBuilding(unit.building_id) : null;
                                    const isTopSuggestion = !actualUnitId && idx === 0 && suggestedContracts.length > 0;
                                    
                                    return (
                                        <SelectItem key={contract.id} value={contract.id}>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt'}
                                                        {secondTenant && ` & ${secondTenant.first_name} ${secondTenant.last_name}`}
                                                    </span>
                                                    {isTopSuggestion && (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                                            Empfohlen
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    {building?.name} {unit?.unit_number} • €{contract.total_rent?.toFixed(2)}/Monat
                                                </span>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Step 4: Financial Item Allocation (for rent_income) */}
                {selectedCategory === 'rent_income' && selectedContractId && (
                    <div className="border-t pt-6">
                        <Label className="text-sm font-medium mb-3 block">
                            4. Forderungen zuordnen
                            <span className="ml-2 text-xs text-slate-500 font-normal">
                                (Nach Relevanz sortiert • Bis aktuelles Datum)
                            </span>
                        </Label>

                        {/* Balance Display */}
                        <div className="bg-slate-50 rounded-lg p-3 mb-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Transaktionsbetrag:</span>
                                <span className="font-semibold">€{transactionAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-slate-600">Zugeordnet:</span>
                                <span className="font-semibold">€{totalAllocated.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-1 pt-2 border-t">
                                <span className="text-slate-600">Verbleibend:</span>
                                <span className={`font-bold ${remaining < 0 ? 'text-red-600' : remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                    €{remaining.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Available Financial Items */}
                        {filteredFinancialItems.length > 0 ? (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredFinancialItems.map((item, idx) => {
                                    const isSelected = allocations.some(a => a.financialItemId === item.id);
                                    const allocation = allocations.find(a => a.financialItemId === item.id);
                                    const openAmount = (item.expected_amount || 0) - (item.amount || 0);
                                    const isTopMatch = idx === 0;

                                    return (
                                        <div 
                                            key={item.id} 
                                            className={`border rounded-lg p-3 cursor-pointer transition-all ${
                                                isSelected 
                                                    ? 'border-emerald-500 bg-emerald-50' 
                                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setAllocations(allocations.filter(a => a.financialItemId !== item.id));
                                                } else {
                                                    setAllocations([...allocations, { 
                                                        financialItemId: item.id, 
                                                        amount: openAmount.toFixed(2) 
                                                    }]);
                                                }
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                                    isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                                                }`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-slate-800">
                                                            {item.payment_month ? (() => {
                                                                try {
                                                                    return format(parseISO(item.payment_month + '-01'), 'MMM yyyy', { locale: de });
                                                                } catch {
                                                                    return item.payment_month;
                                                                }
                                                            })() : item.description}
                                                        </span>
                                                        {isTopMatch && (
                                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                                                Passt am besten
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500">
                                                        {item.category === 'rent' ? 'Miete' : item.category === 'deposit' ? 'Kaution' : item.category}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2 text-sm">
                                                        <span className="text-slate-600">
                                                            Erwartet: <span className="font-medium">€{item.expected_amount?.toFixed(2)}</span>
                                                        </span>
                                                        <span className="text-emerald-600">
                                                            Offen: <span className="font-medium">€{openAmount.toFixed(2)}</span>
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                                                            <Label className="text-xs text-slate-600 mb-1 block">Zuzuordnender Betrag:</Label>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="Betrag"
                                                                value={allocation?.amount || ''}
                                                                onChange={(e) => {
                                                                    const updated = allocations.map(a => 
                                                                        a.financialItemId === item.id 
                                                                            ? { ...a, amount: e.target.value }
                                                                            : a
                                                                    );
                                                                    setAllocations(updated);
                                                                }}
                                                                className="w-40"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                Keine offenen Forderungen bis zum aktuellen Datum gefunden
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Abbrechen
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedCategory || isProcessing || (selectedCategory === 'rent_income' && !selectedContractId)}
                        className={isIncome ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
                    >
                        <Check className="w-4 h-4 mr-2" />
                        {isProcessing ? 'Wird verarbeitet...' : 'Zuordnen'}
                    </Button>
                </div>
            </div>
        </div>
    );
}