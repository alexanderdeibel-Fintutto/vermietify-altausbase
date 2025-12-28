import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tag, X, Check, User, Calendar, Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
const TransactionCategoryCard = React.memo(function TransactionCategoryCard({ 
    transaction, 
    availableCategories = [],
    categoryLabels = {},
    availablePayments = [],
    onCategorize,
    onUncategorize,
    tenants = [],
    units = [],
    buildings = [],
    contracts = [],
    isSelected = false,
    onSelect
}) {


    // Memoize lookup functions
    const getTenant = React.useCallback((tenantId) => tenants.find(t => t.id === tenantId), [tenants]);
    const getUnit = React.useCallback((unitId) => units.find(u => u.id === unitId), [units]);
    const getBuilding = React.useCallback((buildingId) => buildings.find(b => b.id === buildingId), [buildings]);
    const getContract = React.useCallback((contractId) => contracts.find(c => c.id === contractId), [contracts]);



    const handleUncategorize = async () => {
        setIsProcessing(true);
        try {
            await base44.functions.invoke('uncategorizeTransaction', {
                transactionId: transaction.id
            });
            
            toast.success('Kategorisierung aufgehoben');
            
            // Trigger parent refresh
            if (onUncategorize) {
                onUncategorize({ skipUpdate: true });
            }
        } catch (error) {
            toast.error('Fehler beim Aufheben');
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };



    const isPositive = transaction.amount > 0;
    const isCategorized = transaction.is_categorized;

    // Memoize expensive lookups
    const matchedPayment = React.useMemo(() => 
        transaction.matched_payment_id 
            ? availablePayments.find(p => p.id === transaction.matched_payment_id)
            : null,
        [transaction.matched_payment_id, availablePayments]
    );

    const assignedUnit = React.useMemo(() => 
        transaction.unit_id ? getUnit(transaction.unit_id) : null,
        [transaction.unit_id, getUnit]
    );
    
    const assignedBuilding = React.useMemo(() => 
        assignedUnit ? getBuilding(assignedUnit.building_id) : null,
        [assignedUnit, getBuilding]
    );
    
    const assignedContract = React.useMemo(() => 
        transaction.contract_id ? getContract(transaction.contract_id) : null,
        [transaction.contract_id, getContract]
    );

    return (
        <Card className={cn(
            "border-l-4 transition-all",
            isCategorized 
                ? isPositive 
                    ? "border-l-emerald-500 bg-emerald-50/30" 
                    : "border-l-red-500 bg-red-50/30"
                : "border-l-slate-300",
            isSelected && "ring-2 ring-blue-500 bg-blue-50/30"
        )}>
            <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Selection Checkbox */}
                    {!isCategorized && onSelect && (
                        <div className="flex items-start pt-2">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onSelect(transaction.id)}
                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                        </div>
                    )}
                    {/* Transaction Info */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <p className="font-semibold text-slate-800 text-lg mb-1">
                                    {transaction.sender_receiver || 'Unbekannt'}
                                </p>
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-xs font-medium text-slate-500">Buchungstext:</span>
                                        <p className="text-sm text-slate-800 mt-0.5">{transaction.description || '-'}</p>
                                    </div>
                                    
                                    {transaction.reference && (
                                        <div>
                                            <span className="text-xs font-medium text-slate-500">Verwendungszweck:</span>
                                            <p className="text-sm text-slate-800 mt-0.5">{transaction.reference}</p>
                                        </div>
                                    )}
                                    
                                    {transaction.iban && (
                                        <div>
                                            <span className="text-xs font-medium text-slate-500">IBAN:</span>
                                            <p className="text-sm text-slate-800 font-mono mt-0.5">{transaction.iban}</p>
                                        </div>
                                    )}
                                    
                                    {transaction.value_date && (
                                        <div>
                                            <span className="text-xs font-medium text-slate-500">Wertstellung:</span>
                                            <p className="text-sm text-slate-800 mt-0.5">
                                                {(() => {
                                                    try {
                                                        const date = parseISO(transaction.value_date);
                                                        return format(date, 'dd.MM.yyyy', { locale: de });
                                                    } catch {
                                                        return transaction.value_date || '-';
                                                    }
                                                })()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-right ml-4">
                                <p className={cn(
                                    "text-2xl font-bold whitespace-nowrap mb-1",
                                    isPositive ? "text-emerald-600" : "text-red-600"
                                )}>
                                    {isPositive ? '+' : ''}{transaction.amount?.toFixed(2)} €
                                </p>
                                <p className="text-sm text-slate-500 font-medium">
                                    {(() => {
                                        try {
                                            if (!transaction.transaction_date || transaction.transaction_date.trim() === '') {
                                                return '-';
                                            }
                                            const date = parseISO(transaction.transaction_date);
                                            if (isNaN(date.getTime())) {
                                                return transaction.transaction_date;
                                            }
                                            return format(date, 'dd.MM.yyyy', { locale: de });
                                        } catch {
                                            return transaction.transaction_date || '-';
                                        }
                                    })()}
                                </p>
                            </div>
                        </div>

                        {isCategorized && transaction.category && (
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge className={cn(
                                    isPositive 
                                        ? "bg-emerald-100 text-emerald-700" 
                                        : "bg-red-100 text-red-700"
                                )}>
                                    <Tag className="w-3 h-3 mr-1" />
                                    {categoryLabels[transaction.category] || transaction.category}
                                </Badge>
                                {assignedBuilding && assignedUnit && (
                                    <Badge variant="outline" className="text-xs">
                                        <Building2 className="w-3 h-3 mr-1" />
                                        {assignedBuilding.name} - {assignedUnit.unit_number}
                                    </Badge>
                                )}
                                {assignedContract && (
                                    <Badge variant="outline" className="text-xs">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Vertrag: {getTenant(assignedContract.tenant_id)?.first_name} {getTenant(assignedContract.tenant_id)?.last_name}
                                    </Badge>
                                )}
                                {matchedPayment && (
                                    <PaymentPreview 
                                        payment={matchedPayment}
                                        tenants={tenants}
                                        units={units}
                                        buildings={buildings}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Allocation Button */}
                    {!isCategorized && (
                        <div className="lg:w-48 flex items-center justify-center border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-4">
                            <Button 
                                onClick={onCategorize}
                                className={cn(
                                    "w-full",
                                    isPositive 
                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                        : "bg-red-600 hover:bg-red-700"
                                )}
                                size="sm"
                            >
                                <Tag className="w-4 h-4 mr-2" />
                                Zuordnen
                            </Button>
                        </div>
                    )}

                    {isCategorized && (
                        <div className="lg:w-48 flex items-center justify-center border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-4">
                            <Button 
                                onClick={handleUncategorize}
                                disabled={isProcessing}
                                variant="outline"
                                size="sm"
                                className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Aufheben
                            </Button>
                        </div>
                        )}


                        </div>
                        </CardContent>
                        </Card>
                        );
                        });

        export default TransactionCategoryCard;

function PaymentPreview({ payment, tenants, units, buildings }) {
    const tenant = tenants.find(t => t.id === payment.tenant_id);
    const unit = units.find(u => u.id === payment.unit_id);
    const building = unit ? buildings.find(b => b.id === unit.building_id) : null;

    return (
        <Badge variant="outline" className="text-xs">
            <User className="w-3 h-3 mr-1" />
            {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt'}
            {building && unit && ` • ${building.name} ${unit.unit_number}`}
        </Badge>
    );
}