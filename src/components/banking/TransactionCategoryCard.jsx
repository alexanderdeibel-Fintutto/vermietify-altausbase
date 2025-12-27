import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, X, Check, User, Calendar, Building2, Lightbulb } from 'lucide-react';
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
    const [selectedBuildingId, setSelectedBuildingId] = useState('');
    const [selectedUnitId, setSelectedUnitId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCategorize = async () => {
        if (!selectedCategory) return;
        
        setIsProcessing(true);
        try {
            await onCategorize({
                category: selectedCategory,
                paymentId: selectedCategory === 'rent_income' ? selectedPaymentId : null
            });
            
            // Check if a rule should be suggested
            if (transaction.sender_receiver && transaction.sender_receiver.trim() !== '') {
                await checkAndSuggestRule();
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const checkAndSuggestRule = async () => {
        try {
            // Check if a rule already exists
            const existingRules = await base44.entities.CategorizationRule.filter({
                is_active: true
            });

            const matchingRule = existingRules.find(rule => {
                const conditions = rule.conditions || {};
                return conditions.sender_receiver_contains?.toLowerCase() === transaction.sender_receiver.toLowerCase();
            });

            if (matchingRule) {
                // Rule exists - just update match count
                await base44.entities.CategorizationRule.update(matchingRule.id, {
                    match_count: (matchingRule.match_count || 0) + 1
                });
                return;
            }

            // No rule exists - suggest creating one
            toast.info(
                `Regel erstellen für "${transaction.sender_receiver}"?`,
                {
                    action: {
                        label: 'Regel erstellen',
                        onClick: async () => {
                            try {
                                await base44.entities.CategorizationRule.create({
                                    name: `Auto: ${transaction.sender_receiver}`,
                                    is_active: true,
                                    priority: 0,
                                    auto_apply: true,
                                    conditions: {
                                        sender_receiver_contains: transaction.sender_receiver
                                    },
                                    target_category: selectedCategory,
                                    match_count: 1
                                });
                                toast.success('Regel erstellt - wird bei zukünftigen Transaktionen angewendet');
                            } catch (error) {
                                toast.error('Fehler beim Erstellen der Regel');
                            }
                        }
                    },
                    duration: 7000
                }
            );
        } catch (error) {
            console.error('Error checking rules:', error);
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

    // Filter units by selected building
    const filteredUnits = selectedBuildingId 
        ? units.filter(u => u.building_id === selectedBuildingId)
        : [];

    // Filter payments by selected unit
    const filteredPayments = selectedUnitId
        ? availablePayments.filter(p => p.unit_id === selectedUnitId)
        : [];

    // Reset subsequent selections when parent changes
    const handleBuildingChange = (buildingId) => {
        setSelectedBuildingId(buildingId);
        setSelectedUnitId('');
        setSelectedPaymentId('');
    };

    const handleUnitChange = (unitId) => {
        setSelectedUnitId(unitId);
        setSelectedPaymentId('');
    };

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
                                <div className="space-y-2">
                                    {/* Step 1: Building */}
                                    <div>
                                        <Label className="text-xs text-slate-600 mb-1">1. Objekt auswählen</Label>
                                        <Select value={selectedBuildingId} onValueChange={handleBuildingChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Objekt wählen..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {buildings.map(building => (
                                                    <SelectItem key={building.id} value={building.id}>
                                                        {building.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Step 2: Unit */}
                                    {selectedBuildingId && (
                                        <div>
                                            <Label className="text-xs text-slate-600 mb-1">2. Wohnungsnummer</Label>
                                            <Select value={selectedUnitId} onValueChange={handleUnitChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Wohnung wählen..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredUnits.map(unit => (
                                                        <SelectItem key={unit.id} value={unit.id}>
                                                            {unit.unit_number}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Step 3: Payment */}
                                    {selectedUnitId && filteredPayments.length > 0 && (
                                        <div>
                                            <Label className="text-xs text-slate-600 mb-1">3. Zahlung/Monat</Label>
                                            <Select value={selectedPaymentId} onValueChange={setSelectedPaymentId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Zahlung wählen..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredPayments.map(payment => {
                                                        const tenant = getTenant(payment.tenant_id);
                                                        return (
                                                            <SelectItem key={payment.id} value={payment.id}>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">
                                                                        {payment.payment_month}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500">
                                                                        {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt'} • €{payment.expected_amount?.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {selectedUnitId && filteredPayments.length === 0 && (
                                        <p className="text-xs text-slate-500 italic">
                                            Keine offenen Zahlungen für diese Wohnung
                                        </p>
                                    )}
                                </div>
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