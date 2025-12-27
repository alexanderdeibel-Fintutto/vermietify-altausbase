import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Link2, AlertTriangle, X, CheckCircle, Info } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export default function AIMatchSuggestions({ 
    analysis, 
    transactions, 
    payments,
    tenants,
    units,
    buildings,
    onMatch,
    onDismiss 
}) {
    const [appliedMatches, setAppliedMatches] = useState(new Set());

    const getTransaction = (id) => transactions.find(t => t.id === id);
    const getPayment = (id) => payments.find(p => p.id === id);
    const getTenant = (id) => tenants.find(t => t.id === id);
    const getUnit = (id) => units.find(u => u.id === id);

    const handleApplyMatch = (txId, payId) => {
        onMatch(txId, payId);
        setAppliedMatches(prev => new Set([...prev, `${txId}-${payId}`]));
    };

    const alternativeMatches = analysis.alternative_matches || [];
    const discrepancies = analysis.discrepancies || [];
    const missingDetails = analysis.missing_details_predictions || [];

    const highConfidenceMatches = alternativeMatches.filter(m => m.confidence >= 70);
    const mediumConfidenceMatches = alternativeMatches.filter(m => m.confidence >= 40 && m.confidence < 70);

    const severityColors = {
        high: 'border-red-500 bg-red-50',
        medium: 'border-amber-500 bg-amber-50',
        low: 'border-blue-500 bg-blue-50'
    };

    const severityIcons = {
        high: AlertTriangle,
        medium: AlertTriangle,
        low: Info
    };

    return (
        <Card className="border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-white">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <CardTitle className="text-lg">KI-Analyse Ergebnisse</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onDismiss}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* High Confidence Matches */}
                {highConfidenceMatches.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            Empfohlene Übereinstimmungen ({highConfidenceMatches.length})
                        </h3>
                        <div className="space-y-2">
                            {highConfidenceMatches.map((match, idx) => {
                                const tx = getTransaction(match.transaction_id);
                                const payment = getPayment(match.payment_id);
                                const tenant = payment ? getTenant(payment.tenant_id) : null;
                                const matchKey = `${match.transaction_id}-${match.payment_id}`;
                                const isApplied = appliedMatches.has(matchKey);

                                if (!tx || !payment) return null;

                                return (
                                    <Card key={idx} className="border border-emerald-200">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="bg-emerald-600 text-white">
                                                            {match.confidence}% Übereinstimmung
                                                        </Badge>
                                                        <span className="text-xs text-slate-500">
                                                            {match.match_criteria}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                                                        <div>
                                                            <p className="text-xs text-slate-500">Transaktion</p>
                                                            <p className="font-medium text-slate-800">
                                                                {tx.sender_receiver}
                                                            </p>
                                                            <p className="text-xs text-slate-600">
                                                                €{tx.amount?.toFixed(2)} • {tx.transaction_date}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500">Zahlung</p>
                                                            <p className="font-medium text-slate-800">
                                                                {tenant ? `${tenant.first_name} ${tenant.last_name}` : '-'}
                                                            </p>
                                                            <p className="text-xs text-slate-600">
                                                                €{payment.expected_amount?.toFixed(2)} • {payment.payment_month}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <p className="text-xs text-slate-600 italic">
                                                        {match.reasoning}
                                                    </p>
                                                </div>

                                                <Button
                                                    onClick={() => handleApplyMatch(tx.id, payment.id)}
                                                    disabled={isApplied}
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700"
                                                >
                                                    {isApplied ? (
                                                        <>
                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                            Übernommen
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Link2 className="w-4 h-4 mr-1" />
                                                            Abgleichen
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Medium Confidence Matches */}
                {mediumConfidenceMatches.length > 0 && (
                    <Accordion type="single" collapsible>
                        <AccordionItem value="medium">
                            <AccordionTrigger className="text-sm font-semibold text-slate-800">
                                Mögliche Übereinstimmungen ({mediumConfidenceMatches.length})
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2 pt-2">
                                    {mediumConfidenceMatches.map((match, idx) => {
                                        const tx = getTransaction(match.transaction_id);
                                        const payment = getPayment(match.payment_id);
                                        const tenant = payment ? getTenant(payment.tenant_id) : null;
                                        const matchKey = `${match.transaction_id}-${match.payment_id}`;
                                        const isApplied = appliedMatches.has(matchKey);

                                        if (!tx || !payment) return null;

                                        return (
                                            <Card key={idx} className="border border-slate-200">
                                                <CardContent className="p-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 text-xs space-y-1">
                                                            <Badge variant="outline" className="text-xs">
                                                                {match.confidence}%
                                                            </Badge>
                                                            <p className="text-slate-800">
                                                                {tx.sender_receiver} → {tenant ? `${tenant.first_name} ${tenant.last_name}` : '-'}
                                                            </p>
                                                            <p className="text-slate-500">{match.reasoning}</p>
                                                        </div>
                                                        <Button
                                                            onClick={() => handleApplyMatch(tx.id, payment.id)}
                                                            disabled={isApplied}
                                                            size="sm"
                                                            variant="outline"
                                                        >
                                                            {isApplied ? 'Übernommen' : 'Abgleichen'}
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}

                {/* Discrepancies */}
                {discrepancies.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            Identifizierte Diskrepanzen ({discrepancies.length})
                        </h3>
                        <div className="space-y-2">
                            {discrepancies.map((disc, idx) => {
                                const SeverityIcon = severityIcons[disc.severity];
                                
                                return (
                                    <Card key={idx} className={cn("border-l-4", severityColors[disc.severity])}>
                                        <CardContent className="p-3">
                                            <div className="flex items-start gap-3">
                                                <SeverityIcon className={cn(
                                                    "w-4 h-4 mt-0.5",
                                                    disc.severity === 'high' ? 'text-red-600' :
                                                    disc.severity === 'medium' ? 'text-amber-600' :
                                                    'text-blue-600'
                                                )} />
                                                <div className="flex-1 text-sm space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {disc.type.replace('_', ' ')}
                                                        </Badge>
                                                        <Badge variant="outline" className={cn(
                                                            "text-xs",
                                                            disc.severity === 'high' ? 'border-red-500 text-red-700' :
                                                            disc.severity === 'medium' ? 'border-amber-500 text-amber-700' :
                                                            'border-blue-500 text-blue-700'
                                                        )}>
                                                            {disc.severity}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-slate-800 font-medium">{disc.description}</p>
                                                    <p className="text-slate-600 text-xs">
                                                        💡 {disc.suggested_action}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Missing Details Predictions */}
                {missingDetails.length > 0 && (
                    <Accordion type="single" collapsible>
                        <AccordionItem value="missing">
                            <AccordionTrigger className="text-sm font-semibold text-slate-800">
                                Vorhergesagte fehlende Details ({missingDetails.length})
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2 pt-2">
                                    {missingDetails.map((pred, idx) => {
                                        const tx = getTransaction(pred.transaction_id);
                                        if (!tx) return null;

                                        return (
                                            <Card key={idx} className="border border-slate-200">
                                                <CardContent className="p-3 text-xs space-y-1">
                                                    <p className="text-slate-800">
                                                        <span className="font-medium">Transaktion:</span> {tx.description}
                                                    </p>
                                                    <p className="text-emerald-700">
                                                        <span className="font-medium">Vorhergesagter Mieter:</span> {pred.predicted_tenant}
                                                    </p>
                                                    <p className="text-slate-600">{pred.reasoning}</p>
                                                    <Badge variant="outline" className="text-xs">
                                                        {pred.confidence}% Konfidenz
                                                    </Badge>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
}