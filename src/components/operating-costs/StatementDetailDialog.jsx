import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Home, ChevronDown, ChevronUp } from 'lucide-react';

export default function StatementDetailDialog({ open, onOpenChange, statement }) {
    const [expandedItems, setExpandedItems] = useState(new Set());

    const { data: items = [] } = useQuery({
        queryKey: ['operating-cost-statement-items', statement?.id],
        queryFn: () => base44.entities.OperatingCostStatementItem.filter({ statement_id: statement.id }),
        enabled: !!statement
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
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

    const getUnit = (unitId) => units.find(u => u.id === unitId);
    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);
    const getContract = (contractId) => contracts.find(c => c.id === contractId);

    if (!statement) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        Betriebskostenabrechnung Details
                    </DialogTitle>
                    <p className="text-sm text-slate-600 mt-1">
                        {statement.period_start} bis {statement.period_end}
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                    {items.map(item => {
                        const isExpanded = expandedItems.has(item.id);
                        const unit = getUnit(item.unit_id);
                        const contract = item.contract_id ? getContract(item.contract_id) : null;
                        const tenant = contract?.tenant_id ? getTenant(contract.tenant_id) : null;

                        return (
                            <Card key={item.id} className="p-4">
                                <button
                                    onClick={() => toggleDetails(item.id)}
                                    className="w-full"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {item.is_vacancy ? (
                                                <Home className="w-5 h-5 text-amber-600" />
                                            ) : (
                                                <User className="w-5 h-5 text-slate-400" />
                                            )}
                                            <div className="text-left">
                                                <p className="font-semibold text-slate-800">
                                                    {item.is_vacancy 
                                                        ? `Leerstand (${unit?.unit_number})` 
                                                        : (tenant ? `${tenant.first_name} ${tenant.last_name} (${unit?.unit_number})` : 'Unbekannt')
                                                    }
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {item.is_vacancy 
                                                        ? `${item.vacancy_start} - ${item.vacancy_end}`
                                                        : `${unit?.unit_number || 'N/A'}`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm text-slate-600">Betriebskosten</p>
                                                <p className="text-lg font-bold text-slate-800">
                                                    €{(item.total_amount || item.allocated_amount || 0).toFixed(2)}
                                                </p>
                                            </div>
                                            {!item.is_vacancy && (
                                                <>
                                                    <div className="text-right">
                                                        <p className="text-sm text-slate-600">Vorauszahlungen</p>
                                                        <p className="text-lg font-semibold text-slate-700">
                                                            €{(item.advance_payments || 0).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-slate-600">Differenz</p>
                                                        <Badge className={(item.difference || 0) <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                                            {(item.difference || 0) <= 0 ? 'Guthaben' : 'Nachzahlung'}: €{Math.abs(item.difference || 0).toFixed(2)}
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
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-slate-600">Wohneinheit</p>
                                                <p className="font-medium text-slate-800">{unit?.unit_number || 'N/A'}</p>
                                            </div>
                                            {item.number_of_persons && (
                                                <div>
                                                    <p className="text-slate-600">Anzahl Personen</p>
                                                    <p className="font-medium text-slate-800">{item.number_of_persons}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-slate-600">Quadratmeter</p>
                                                <p className="font-medium text-slate-800">{unit?.sqm || 'N/A'} m²</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}