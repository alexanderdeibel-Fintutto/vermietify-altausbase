import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, X, Check, User, Calendar, Building2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function TransactionCategoryCard({ 
    transaction, 
    availableCategories = [],
    categoryLabels = {},
    availablePayments = [],
    onCategorize,
    onUncategorize,
    tenants = [],
    units = [],
    buildings = []
}) {
    const [selectedCategory, setSelectedCategory] = useState(transaction.category || '');
    const [selectedPaymentId, setSelectedPaymentId] = useState(transaction.matched_payment_id || '');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCategorize = async () => {
        if (!selectedCategory) return;
        
        setIsProcessing(true);
        try {
            await onCategorize({
                category: selectedCategory,
                paymentId: selectedCategory === 'rent_income' ? selectedPaymentId : null
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUncategorize = async () => {
        setIsProcessing(true);
        try {
            await onUncategorize();
        } finally {
            setIsProcessing(false);
        }
    };

    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);
    const getUnit = (unitId) => units.find(u => u.id === unitId);
    const getBuilding = (buildingId) => buildings.find(b => b.id === buildingId);

    const isPositive = transaction.amount > 0;
    const isCategorized = transaction.is_categorized;

    const matchedPayment = transaction.matched_payment_id 
        ? availablePayments.find(p => p.id === transaction.matched_payment_id)
        : null;

    return (
        <Card className={cn(
            "border-l-4",
            isCategorized 
                ? isPositive 
                    ? "border-l-emerald-500 bg-emerald-50/30" 
                    : "border-l-red-500 bg-red-50/30"
                : "border-l-slate-300"
        )}>
            <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Transaction Info */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <p className="font-semibold text-slate-800">
                                    {transaction.sender_receiver || 'Unbekannt'}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {transaction.description}
                                </p>
                                {transaction.reference && transaction.reference !== transaction.description && (
                                    <p className="text-xs text-slate-400 mt-1">
                                        Ref: {transaction.reference}
                                    </p>
                                )}
                            </div>
                            <div className="text-right ml-4">
                                <p className={cn(
                                    "text-xl font-bold whitespace-nowrap",
                                    isPositive ? "text-emerald-600" : "text-red-600"
                                )}>
                                    {isPositive ? '+' : ''}{transaction.amount?.toFixed(2)} €
                                </p>
                                <p className="text-xs text-slate-500">
                                    {transaction.transaction_date && transaction.transaction_date.trim() !== '' 
                                        ? format(parseISO(transaction.transaction_date), 'dd.MM.yyyy', { locale: de })
                                        : '-'
                                    }
                                </p>
                            </div>
                        </div>

                        {isCategorized && transaction.category && (
                            <div className="flex items-center gap-2 mt-2">
                                <Badge className={cn(
                                    isPositive 
                                        ? "bg-emerald-100 text-emerald-700" 
                                        : "bg-red-100 text-red-700"
                                )}>
                                    <Tag className="w-3 h-3 mr-1" />
                                    {categoryLabels[transaction.category] || transaction.category}
                                </Badge>
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

                    {/* Categorization Section */}
                    {!isCategorized && (
                        <div className="lg:w-96 border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-4">
                            <p className="text-sm font-medium text-slate-700 mb-2">
                                Kategorie zuordnen:
                            </p>

                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="mb-2">
                                    <SelectValue placeholder="Kategorie wählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableCategories.map(cat => (
                                        <SelectItem key={cat} value={cat}>
                                            {categoryLabels[cat] || cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {selectedCategory === 'rent_income' && availablePayments.length > 0 && (
                                <Select value={selectedPaymentId} onValueChange={setSelectedPaymentId}>
                                    <SelectTrigger className="mb-2">
                                        <SelectValue placeholder="Zahlung zuordnen (optional)..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availablePayments.map(payment => {
                                            const tenant = getTenant(payment.tenant_id);
                                            const unit = getUnit(payment.unit_id);
                                            const building = unit ? getBuilding(unit.building_id) : null;
                                            
                                            return (
                                                <SelectItem key={payment.id} value={payment.id}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt'}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {building?.name} {unit?.unit_number} • €{payment.expected_amount?.toFixed(2)} • {payment.payment_month}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            )}

                            <Button 
                                onClick={handleCategorize}
                                disabled={!selectedCategory || isProcessing}
                                className={cn(
                                    "w-full",
                                    isPositive 
                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                        : "bg-red-600 hover:bg-red-700"
                                )}
                                size="sm"
                            >
                                <Tag className="w-4 h-4 mr-2" />
                                Kategorisieren
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
}

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