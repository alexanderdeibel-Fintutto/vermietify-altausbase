import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Home, PiggyBank, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const calculatorIcons = {
    rendite: TrendingUp,
    kaufpreis: Home,
    tilgung: PiggyBank,
    cashflow: DollarSign,
    wertentwicklung: TrendingUp,
    indexmiete: TrendingUp,
    afa: Calculator
};

const calculatorLabels = {
    rendite: 'Rendite-Rechner',
    kaufpreis: 'Kaufpreis-Rechner',
    tilgung: 'Tilgungs-Rechner',
    cashflow: 'Cashflow-Rechner',
    wertentwicklung: 'Wertentwicklung',
    indexmiete: 'Indexmieten-Rechner',
    afa: 'AfA-Rechner'
};

export default function CalculationHistoryEnhanced() {
    const { data: calculations = [], isLoading } = useQuery({
        queryKey: ['calculations'],
        queryFn: () => base44.entities.CalculationHistory.list('-created_date', 50)
    });

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Berechnungs-Historie</h1>
                    <p className="vf-page-subtitle">Alle durchgeführten Berechnungen</p>
                </div>
            </div>

            {calculations.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-600">Noch keine Berechnungen vorhanden</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {calculations.map((calc) => {
                        const Icon = calculatorIcons[calc.calculator_type] || Calculator;
                        return (
                            <Card key={calc.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="vf-tool-icon w-12 h-12 flex-shrink-0">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-lg">
                                                        {calculatorLabels[calc.calculator_type] || calc.calculator_type}
                                                    </h3>
                                                    {calc.user_email && (
                                                        <p className="text-sm text-gray-600">{calc.user_email}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500">
                                                        {format(new Date(calc.created_date), 'dd.MM.yyyy HH:mm', { locale: de })}
                                                    </p>
                                                    {calc.is_saved && (
                                                        <Badge className="vf-badge-success mt-1">Gespeichert</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            {calc.result_summary && (
                                                <p className="text-sm text-gray-700 mb-2">{calc.result_summary}</p>
                                            )}
                                            <div className="flex gap-2 text-xs text-gray-500">
                                                <span>Session: {calc.session_id?.substring(0, 8) || 'N/A'}</span>
                                                {calc.lead_captured && (
                                                    <Badge className="vf-badge-success">Lead erfasst</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}