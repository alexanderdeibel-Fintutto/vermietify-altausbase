import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, X, Check, User, Calendar, Building2, Tag, Sparkles } from 'lucide-react';
import { findMatchSuggestions } from '@/components/banking/matchTransactions';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function TransactionMatchCard({ 
    transaction, 
    suggestedPayment, 
    matchScore,
    availablePayments = [],
    onMatch,
    onUnmatch,
    tenants = [],
    units = [],
    buildings = []
}) {
    const [selectedPaymentId, setSelectedPaymentId] = useState(
        suggestedPayment?.id || ''
    );
    const [isMatching, setIsMatching] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const { data: categories = [] } = useQuery({
        queryKey: ['transactionCategories'],
        queryFn: () => base44.entities.TransactionCategory.list()
    });

    const category = categories.find(c => c.id === transaction.category_id);

    // Lade intelligente Vorschläge wenn keine manuelle Auswahl getroffen wurde
    useEffect(() => {
        if (!isMatched && isPositive && !suggestedPayment) {
            setLoadingSuggestions(true);
            findMatchSuggestions(transaction).then(suggestions => {
                setAiSuggestions(suggestions);
                if (suggestions.length > 0 && suggestions[0].isHighConfidence) {
                    setSelectedPaymentId(suggestions[0].payment.id);
                }
                setLoadingSuggestions(false);
            });
        }
    }, [transaction.id]);

    const handleMatch = async () => {
        if (!selectedPaymentId) return;
        setIsMatching(true);
        try {
            await onMatch(transaction.id, selectedPaymentId);
        } finally {
            setIsMatching(false);
        }
    };

    const handleUnmatch = async () => {
        setIsMatching(true);
        try {
            await onUnmatch(transaction.id);
        } finally {
            setIsMatching(false);
        }
    };

    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);
    const getUnit = (unitId) => units.find(u => u.id === unitId);
    const getBuilding = (buildingId) => buildings.find(b => b.id === buildingId);

    const isPositive = transaction.amount > 0;
    const isMatched = transaction.is_matched;

    return (
        <Card className={cn(
            "border-l-4",
            isMatched ? "border-l-emerald-500 bg-emerald-50/30" : "border-l-slate-300"
        )}>
            <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Transaction Info */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <p className="font-semibold text-slate-800">
                                    {transaction.sender_receiver || 'Unbekannt'}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {transaction.description}
                                </p>
                                {transaction.reference && (
                                    <p className="text-xs text-slate-400 mt-1">
                                        Ref: {transaction.reference}
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className={cn(
                                    "text-xl font-bold",
                                    isPositive ? "text-emerald-600" : "text-red-600"
                                )}>
                                    {isPositive ? '+' : ''}{transaction.amount?.toFixed(2)} €
                                </p>
                                <p className="text-xs text-slate-500">
                                    {format(parseISO(transaction.transaction_date), 'dd.MM.yyyy')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                            {isMatched && transaction.matched_payment_id && (
                                <Badge className="bg-emerald-100 text-emerald-700">
                                    <Check className="w-3 h-3 mr-1" />
                                    Abgeglichen
                                </Badge>
                            )}
                            {category && (
                                <Badge 
                                    className="text-white"
                                    style={{ backgroundColor: category.color || '#64748b' }}
                                >
                                    <Tag className="w-3 h-3 mr-1" />
                                    {category.name}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Matching Section */}
                    {!isMatched && isPositive && (
                        <div className="md:w-96 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4">
                            <p className="text-sm font-medium text-slate-700 mb-2">
                                Mit Zahlung abgleichen:
                            </p>

                            {suggestedPayment && matchScore && (
                                <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-medium text-blue-700 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" />
                                            Empfohlen ({matchScore}% Übereinstimmung)
                                        </p>
                                    </div>
                                    <PaymentPreview 
                                        payment={suggestedPayment}
                                        tenants={tenants}
                                        units={units}
                                        buildings={buildings}
                                    />
                                </div>
                            )}

                            {!suggestedPayment && aiSuggestions.length > 0 && (
                                <div className="mb-3 space-y-2">
                                    {aiSuggestions.slice(0, 2).map((suggestion, idx) => {
                                        const tenant = getTenant(suggestion.payment.tenant_id);
                                        const unit = getUnit(suggestion.payment.unit_id);
                                        const building = unit ? getBuilding(unit.building_id) : null;
                                        
                                        return (
                                            <div 
                                                key={suggestion.payment.id}
                                                className={cn(
                                                    "p-2 rounded-lg border cursor-pointer transition-all",
                                                    selectedPaymentId === suggestion.payment.id 
                                                        ? "bg-emerald-50 border-emerald-300" 
                                                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                                                )}
                                                onClick={() => setSelectedPaymentId(suggestion.payment.id)}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-xs font-medium text-slate-700 flex items-center gap-1">
                                                        {suggestion.isHighConfidence && <Sparkles className="w-3 h-3 text-amber-500" />}
                                                        {idx === 0 ? 'Top-Vorschlag' : 'Alternative'} ({suggestion.score}%)
                                                    </p>
                                                </div>
                                                <div className="text-xs space-y-1">
                                                    {tenant && (
                                                        <div className="flex items-center gap-1 text-slate-700">
                                                            <User className="w-3 h-3" />
                                                            {tenant.first_name} {tenant.last_name}
                                                        </div>
                                                    )}
                                                    {building && unit && (
                                                        <div className="flex items-center gap-1 text-slate-600">
                                                            <Building2 className="w-3 h-3" />
                                                            {building.name} - {unit.unit_number}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1 text-slate-600">
                                                        <Calendar className="w-3 h-3" />
                                                        {suggestion.payment.payment_month} • €{suggestion.payment.expected_amount?.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {loadingSuggestions && (
                                <div className="mb-3 p-3 bg-slate-50 rounded-lg text-center">
                                    <p className="text-xs text-slate-500">Analysiere Muster...</p>
                                </div>
                            )}

                            <Select value={selectedPaymentId} onValueChange={setSelectedPaymentId}>
                                <SelectTrigger className="mb-2">
                                    <SelectValue placeholder="Zahlung auswählen..." />
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

                            <Button 
                                onClick={handleMatch}
                                disabled={!selectedPaymentId || isMatching}
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                size="sm"
                            >
                                <Link2 className="w-4 h-4 mr-2" />
                                Abgleichen
                            </Button>
                        </div>
                    )}

                    {isMatched && (
                        <div className="md:w-48 flex items-center justify-center border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4">
                            <Button 
                                onClick={handleUnmatch}
                                disabled={isMatching}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Abgleich aufheben
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
        <div className="text-xs space-y-1">
            {tenant && (
                <div className="flex items-center gap-1 text-slate-700">
                    <User className="w-3 h-3" />
                    {tenant.first_name} {tenant.last_name}
                </div>
            )}
            {building && unit && (
                <div className="flex items-center gap-1 text-slate-600">
                    <Building2 className="w-3 h-3" />
                    {building.name} - {unit.unit_number}
                </div>
            )}
            <div className="flex items-center gap-1 text-slate-600">
                <Calendar className="w-3 h-3" />
                {payment.payment_month} • €{payment.expected_amount?.toFixed(2)}
            </div>
        </div>
    );
}