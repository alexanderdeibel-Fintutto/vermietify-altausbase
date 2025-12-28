import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Plus, Trash2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
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
    payments
}) {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedObjectId, setSelectedObjectId] = useState('');
    const [selectedContractId, setSelectedContractId] = useState('');
    const [allocations, setAllocations] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const isIncome = transaction.amount > 0;
    const selectedUnit = units.find(u => u.id === selectedObjectId);
    const actualUnitId = selectedUnit ? selectedObjectId : null;

    // Filter contracts based on selection
    const filteredContracts = React.useMemo(() => {
        if (selectedCategory === 'rent_income') {
            return actualUnitId
                ? contracts.filter(c => c.unit_id === actualUnitId && c.status === 'active')
                : contracts.filter(c => c.status === 'active');
        }
        return [];
    }, [actualUnitId, contracts, selectedCategory]);

    // Filter payments based on contract
    const filteredPayments = React.useMemo(() => {
        if (selectedCategory === 'rent_income' && selectedContractId) {
            return payments.filter(p => 
                p.contract_id === selectedContractId && 
                (p.status === 'pending' || p.status === 'partial' || p.status === 'overdue')
            );
        }
        return [];
    }, [selectedContractId, payments, selectedCategory]);

    // Calculate totals
    const transactionAmount = Math.abs(transaction.amount);
    const totalAllocated = allocations.reduce((sum, alloc) => sum + (parseFloat(alloc.amount) || 0), 0);
    const remaining = transactionAmount - totalAllocated;

    const addAllocation = () => {
        setAllocations([...allocations, { paymentId: '', amount: '' }]);
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
        const openPayments = filteredPayments.slice().sort((a, b) => 
            new Date(a.payment_month) - new Date(b.payment_month)
        );

        const newAllocations = [];
        let remainingAmount = transactionAmount;

        for (const payment of openPayments) {
            if (remainingAmount <= 0) break;

            const openAmount = (payment.expected_amount || 0) - (payment.amount || 0);
            const allocateAmount = Math.min(remainingAmount, openAmount);

            if (allocateAmount > 0) {
                newAllocations.push({
                    paymentId: payment.id,
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
                // Use backend function for payment allocation
                const paymentAllocations = allocations
                    .filter(a => a.paymentId && parseFloat(a.amount) > 0)
                    .map(a => ({
                        paymentId: a.paymentId,
                        amount: parseFloat(a.amount)
                    }));

                if (paymentAllocations.length === 0) {
                    toast.error('Bitte ordnen Sie mindestens eine Forderung zu');
                    setIsProcessing(false);
                    return;
                }

                await base44.functions.invoke('reconcileTransactionWithPayments', {
                    transactionId: transaction.id,
                    paymentAllocations,
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

    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);
    const getUnit = (unitId) => units.find(u => u.id === unitId);
    const getBuilding = (buildingId) => buildings.find(b => b.id === buildingId);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-800">
                        Transaktion zuordnen
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Transaction Info */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-slate-800">{transaction.sender_receiver}</p>
                            <p className="text-sm text-slate-600 mt-1">{transaction.description}</p>
                            {transaction.reference && (
                                <p className="text-xs text-slate-500 mt-1">{transaction.reference}</p>
                            )}
                        </div>
                        <p className={`text-2xl font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isIncome ? '+' : ''}{transaction.amount?.toFixed(2)} €
                        </p>
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
                        <Label className="text-sm font-medium mb-2">3. Mietvertrag wählen *</Label>
                        <Select value={selectedContractId} onValueChange={(value) => {
                            setSelectedContractId(value);
                            setAllocations([]);
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Vertrag auswählen..." />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredContracts.map(contract => {
                                    const tenant = getTenant(contract.tenant_id);
                                    const secondTenant = contract.second_tenant_id ? getTenant(contract.second_tenant_id) : null;
                                    const unit = getUnit(contract.unit_id);
                                    const building = unit ? getBuilding(unit.building_id) : null;
                                    return (
                                        <SelectItem key={contract.id} value={contract.id}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt'}
                                                    {secondTenant && ` & ${secondTenant.first_name} ${secondTenant.last_name}`}
                                                </span>
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

                {/* Step 4: Payment Allocation (for rent_income) */}
                {selectedCategory === 'rent_income' && selectedContractId && filteredPayments.length > 0 && (
                    <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <Label className="text-sm font-medium">4. Forderungen zuordnen</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleQuickAllocate}
                            >
                                Automatisch zuordnen
                            </Button>
                        </div>

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

                        {/* Allocations */}
                        <div className="space-y-3 mb-4">
                            {allocations.map((alloc, index) => {
                                const payment = filteredPayments.find(p => p.id === alloc.paymentId);
                                const tenant = payment ? getTenant(payment.tenant_id) : null;
                                const unit = payment ? getUnit(payment.unit_id) : null;
                                const building = unit ? getBuilding(unit.building_id) : null;
                                const openAmount = payment ? (payment.expected_amount || 0) - (payment.amount || 0) : 0;

                                return (
                                    <div key={index} className="flex gap-2 items-start">
                                        <div className="flex-1">
                                            <Select 
                                                value={alloc.paymentId} 
                                                onValueChange={(value) => updateAllocation(index, 'paymentId', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Forderung wählen..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredPayments.map(p => {
                                                        const t = getTenant(p.tenant_id);
                                                        const u = getUnit(p.unit_id);
                                                        const b = u ? getBuilding(u.building_id) : null;
                                                        const open = (p.expected_amount || 0) - (p.amount || 0);
                                                        return (
                                                            <SelectItem key={p.id} value={p.id}>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{p.payment_month}</span>
                                                                    <span className="text-xs text-slate-500">
                                                                        {t ? `${t.first_name} ${t.last_name}` : 'Unbekannt'} • 
                                                                        {b?.name} {u?.unit_number} • 
                                                                        Offen: €{open.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                            {payment && (
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Offener Betrag: €{openAmount.toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Betrag"
                                            value={alloc.amount}
                                            onChange={(e) => updateAllocation(index, 'amount', e.target.value)}
                                            className="w-32"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeAllocation(index)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            onClick={addAllocation}
                            className="w-full"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Weitere Forderung hinzufügen
                        </Button>
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