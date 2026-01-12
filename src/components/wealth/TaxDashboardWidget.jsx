import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Calculator, ArrowRight, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function TaxDashboardWidget() {
    const currentYear = new Date().getFullYear();

    const { data: taxSummaries = [] } = useQuery({
        queryKey: ['taxSummaries', currentYear],
        queryFn: async () => {
            const summaries = await base44.entities.TaxSummary.list();
            return summaries.filter(s => s.tax_year === currentYear);
        }
    });

    const { data: suggestions = [] } = useQuery({
        queryKey: ['taxSuggestions', currentYear],
        queryFn: async () => {
            const allSuggestions = await base44.entities.TaxHarvestingSuggestion.list();
            return allSuggestions.filter(s => s.tax_year === currentYear && s.status === 'pending');
        }
    });

    const totalTaxLiability = taxSummaries.reduce((sum, s) => sum + (s.estimated_tax_liability || 0), 0);
    const totalSaverAllowanceUsed = taxSummaries.reduce((sum, s) => sum + (s.saver_allowance_used || 0), 0);
    const totalSaverAllowanceRemaining = taxSummaries.reduce((sum, s) => sum + (s.saver_allowance_remaining || 0), 0);
    const totalSaverAllowance = totalSaverAllowanceUsed + totalSaverAllowanceRemaining;
    const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high').length;

    const getTaxColor = (amount) => {
        if (amount < 500) return 'text-green-600';
        if (amount < 2000) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-slate-400" />
                    Steuerübersicht {currentYear}
                </CardTitle>
                <Link to={createPageUrl('TaxDashboard')}>
                    <ArrowRight className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                </Link>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Geschätzte Steuerlast */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600">Geschätzte Steuerlast</span>
                        <span className={`text-lg font-light ${getTaxColor(totalTaxLiability)}`}>
                            {totalTaxLiability.toFixed(2)} €
                        </span>
                    </div>
                    <div className="text-xs text-slate-500">
                        {totalTaxLiability < 500 ? 'Niedrige Belastung' : 
                         totalTaxLiability < 2000 ? 'Moderate Belastung' : 'Hohe Belastung'}
                    </div>
                </div>

                {/* Sparerpauschbetrag */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Sparerpauschbetrag</span>
                        <span className="text-sm font-medium text-slate-900">
                            {totalSaverAllowanceUsed.toFixed(0)} / {totalSaverAllowance.toFixed(0)} €
                        </span>
                    </div>
                    <Progress value={(totalSaverAllowanceUsed / totalSaverAllowance) * 100} className="h-2" />
                    <div className="text-xs text-slate-500 mt-1">
                        {totalSaverAllowanceRemaining.toFixed(0)} € verfügbar
                    </div>
                </div>

                {/* Tax-Loss Harvesting */}
                <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600">Optimierungen</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{suggestions.length}</span>
                        {highPrioritySuggestions > 0 && (
                            <Badge variant="destructive" className="text-xs">
                                {highPrioritySuggestions} dringend
                            </Badge>
                        )}
                    </div>
                </div>

                <Link to={createPageUrl('TaxDashboard')} className="block">
                    <div className="text-center text-sm text-blue-600 hover:text-blue-700 font-medium pt-2 border-t">
                        Zum Steuer-Dashboard →
                    </div>
                </Link>
            </CardContent>
        </Card>
    );
}