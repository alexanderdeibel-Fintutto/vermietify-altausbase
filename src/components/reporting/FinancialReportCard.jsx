import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp } from 'lucide-react';

export default function FinancialReportCard({ data, isLoading }) {
    if (isLoading) {
        return <Card><CardContent className="pt-6">Wird geladen...</CardContent></Card>;
    }

    if (!data) {
        return <Card><CardContent className="pt-6">Keine Daten verfügbar</CardContent></Card>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Finanzübersicht: {data.building_name}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-xs text-slate-600">Mieteinnahmen (monatlich)</p>
                        <p className="text-2xl font-bold text-blue-600">
                            €{data.financial_summary.total_rent_income.toLocaleString('de-DE')}
                        </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                        <p className="text-xs text-slate-600">Ausgaben (monatlich)</p>
                        <p className="text-2xl font-bold text-red-600">
                            €{data.financial_summary.total_expenses.toLocaleString('de-DE')}
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <p className="text-xs text-slate-600 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Netto Monatsgewinn
                    </p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                        €{data.financial_summary.monthly_net_income.toLocaleString('de-DE')}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                        Jährlich: €{data.financial_summary.yearly_projected.toLocaleString('de-DE')}
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Kaltmiete:</span>
                        <span className="font-medium">€{data.financial_summary.base_rent.toLocaleString('de-DE')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Nebenkosten:</span>
                        <span className="font-medium">€{data.financial_summary.utilities.toLocaleString('de-DE')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Aktive Verträge:</span>
                        <Badge>{data.active_contracts}</Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}