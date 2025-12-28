import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Check } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function TransactionPaymentAllocation({ 
    transaction,
    availablePayments = [],
    onAllocate,
    onCancel,
    tenants = [],
    units = [],
    buildings = []
}) {
    const [allocations, setAllocations] = useState([]);
    const transactionAmount = Math.abs(transaction.amount);

    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);
    const getUnit = (unitId) => units.find(u => u.id === unitId);
    const getBuilding = (buildingId) => buildings.find(b => b.id === buildingId);

    const totalAllocated = allocations.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
    const remaining = transactionAmount - totalAllocated;

    const addAllocation = () => {
        setAllocations([...allocations, { paymentId: '', amount: '' }]);
    };

    const removeAllocation = (index) => {
        setAllocations(allocations.filter((_, i) => i !== index));
    };

    const updateAllocation = (index, field, value) => {
        const updated = [...allocations];
        updated[index] = { ...updated[index], [field]: value };
        setAllocations(updated);
    };

    const handleSubmit = () => {
        const validAllocations = allocations
            .filter(a => a.paymentId && a.amount > 0)
            .map(a => ({ paymentId: a.paymentId, amount: parseFloat(a.amount) }));

        if (validAllocations.length === 0) {
            return;
        }

        onAllocate(validAllocations);
    };

    const quickAllocate = (payment) => {
        const openAmount = payment.expected_amount - (payment.amount || 0);
        const amountToAllocate = Math.min(openAmount, remaining);
        
        if (amountToAllocate > 0) {
            setAllocations([...allocations, { 
                paymentId: payment.id, 
                amount: amountToAllocate.toFixed(2) 
            }]);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">Transaktionsbetrag:</span>
                    <span className="text-lg font-bold text-blue-800">
                        €{transactionAmount.toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">Verbleibend:</span>
                    <span className={cn(
                        "text-lg font-bold",
                        remaining === 0 ? "text-green-600" : remaining < 0 ? "text-red-600" : "text-slate-800"
                    )}>
                        €{remaining.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Quick allocation for available payments */}
            {availablePayments.length > 0 && allocations.length === 0 && (
                <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Schnellzuordnung zu offenen Forderungen:</Label>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                        {availablePayments
                            .filter(p => (p.expected_amount - (p.amount || 0)) > 0)
                            .slice(0, 10)
                            .map(payment => {
                                const tenant = getTenant(payment.tenant_id);
                                const unit = getUnit(payment.unit_id);
                                const building = unit ? getBuilding(unit.building_id) : null;
                                const openAmount = payment.expected_amount - (payment.amount || 0);

                                return (
                                    <button
                                        key={payment.id}
                                        onClick={() => quickAllocate(payment)}
                                        className="w-full text-left p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 transition-colors"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-800">
                                                    {payment.payment_month}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt'}
                                                    {building && unit && ` • ${building.name} ${unit.unit_number}`}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-red-600">
                                                    €{openAmount.toFixed(2)}
                                                </p>
                                                <p className="text-xs text-slate-400">offen</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Manual allocations */}
            {allocations.length > 0 && (
                <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">Manuelle Zuordnung:</Label>
                    {allocations.map((allocation, index) => (
                        <div key={index} className="flex gap-2 items-end">
                            <div className="flex-1">
                                <Label className="text-xs">Forderung</Label>
                                <select
                                    value={allocation.paymentId}
                                    onChange={(e) => updateAllocation(index, 'paymentId', e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                >
                                    <option value="">Auswählen...</option>
                                    {availablePayments.map(payment => {
                                        const tenant = getTenant(payment.tenant_id);
                                        const unit = getUnit(payment.unit_id);
                                        const building = unit ? getBuilding(unit.building_id) : null;
                                        const openAmount = payment.expected_amount - (payment.amount || 0);
                                        
                                        return (
                                            <option key={payment.id} value={payment.id}>
                                                {payment.payment_month} - {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt'} 
                                                {building && unit && ` (${building.name} ${unit.unit_number})`}
                                                {' '}• offen: €{openAmount.toFixed(2)}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="w-32">
                                <Label className="text-xs">Betrag (€)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={allocation.amount}
                                    onChange={(e) => updateAllocation(index, 'amount', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeAllocation(index)}
                                className="text-red-600 hover:text-red-700"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAllocation}
                className="w-full"
                disabled={remaining <= 0}
            >
                <Plus className="w-4 h-4 mr-2" />
                Weitere Zuordnung hinzufügen
            </Button>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Abbrechen
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={allocations.length === 0 || remaining < 0}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    <Check className="w-4 h-4 mr-2" />
                    Zuordnung speichern
                </Button>
            </div>
        </div>
    );
}