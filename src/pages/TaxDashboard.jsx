import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, TrendingDown, Calculator, Calendar, Info } from 'lucide-react';
import CapitalGainsWidget from '@/components/tax/CapitalGainsWidget';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';

export default function TaxDashboard() {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);

    const { data: portfolios = [] } = useQuery({
        queryKey: ['portfolios'],
        queryFn: () => base44.entities.Portfolio.list()
    });

    const { data: taxSummaries = [] } = useQuery({
        queryKey: ['taxSummaries', selectedYear],
        queryFn: async () => {
            const summaries = await base44.entities.TaxSummary.list();
            return summaries.filter(s => s.tax_year === selectedYear);
        }
    });

    const { data: suggestions = [] } = useQuery({
        queryKey: ['taxSuggestions', selectedYear],
        queryFn: async () => {
            const allSuggestions = await base44.entities.TaxHarvestingSuggestion.list();
            return allSuggestions.filter(s => s.tax_year === selectedYear && s.status === 'pending');
        }
    });

    const { data: taxEvents = [] } = useQuery({
        queryKey: ['taxEvents', selectedYear],
        queryFn: async () => {
            const events = await base44.entities.TaxEvent.list();
            return events.filter(e => e.tax_year === selectedYear).sort((a, b) => 
                Math.abs(b.gain_loss) - Math.abs(a.gain_loss)
            ).slice(0, 5);
        }
    });

    const totalTaxLiability = taxSummaries.reduce((sum, s) => sum + (s.estimated_tax_liability || 0), 0);
    const totalSaverAllowanceUsed = taxSummaries.reduce((sum, s) => sum + (s.saver_allowance_used || 0), 0);
    const totalSaverAllowanceRemaining = taxSummaries.reduce((sum, s) => sum + (s.saver_allowance_remaining || 0), 0);
    const totalSaverAllowance = totalSaverAllowanceUsed + totalSaverAllowanceRemaining;

    const getTaxColor = (amount) => {
        if (amount < 500) return 'text-green-600';
        if (amount < 2000) return 'text-yellow-600';
        return 'text-red-600';
    };

    const chartData = taxSummaries.map(summary => ({
        name: portfolios.find(p => p.id === summary.portfolio_id)?.name || 'Portfolio',
        Dividenden: summary.total_dividends,
        Aktiengewinne: summary.total_capital_gains_stocks,
        Fonds: summary.total_capital_gains_funds,
        Krypto: summary.total_capital_gains_crypto,
        Zinsen: summary.total_interest
    }));

    const highPriority = suggestions.filter(s => s.priority === 'high').length;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light text-slate-900">Steuerübersicht</h1>
                    <p className="text-slate-500 mt-1">Überblick über Ihre steuerliche Situation</p>
                </div>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Große Karten oben */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Geschätzte Steuerlast</CardTitle>
                        <Calculator className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-light ${getTaxColor(totalTaxLiability)}`}>
                            {totalTaxLiability.toFixed(2)} €
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            {totalTaxLiability < 500 ? 'Niedrige Steuerlast' : 
                             totalTaxLiability < 2000 ? 'Moderate Steuerlast' : 'Hohe Steuerlast'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Sparerpauschbetrag</CardTitle>
                        <TrendingUp className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Genutzt:</span>
                                <span className="font-medium">{totalSaverAllowanceUsed.toFixed(2)} €</span>
                            </div>
                            <Progress value={(totalSaverAllowanceUsed / totalSaverAllowance) * 100} />
                            <div className="text-xs text-slate-500">
                                {totalSaverAllowanceRemaining.toFixed(2)} € verfügbar
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Tax-Loss Harvesting</CardTitle>
                        <AlertCircle className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-light text-slate-900">{suggestions.length}</div>
                        <p className="text-xs text-slate-500 mt-2">
                            {highPriority > 0 && <span className="text-red-600 font-medium">{highPriority} dringend</span>}
                            {highPriority === 0 && 'Keine dringenden Vorschläge'}
                        </p>
                        <Link to={createPageUrl('TaxHarvesting')}>
                            <Button variant="outline" size="sm" className="mt-2 w-full">
                                Alle Vorschläge
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Kapitalerträge Widget */}
            <CapitalGainsWidget taxYear={selectedYear} />

            {/* Mittlerer Bereich */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-medium">Erträge nach Kategorie</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="Dividenden" fill="#10b981" />
                                    <Bar dataKey="Aktiengewinne" fill="#3b82f6" />
                                    <Bar dataKey="Fonds" fill="#8b5cf6" />
                                    <Bar dataKey="Krypto" fill="#f59e0b" />
                                    <Bar dataKey="Zinsen" fill="#06b6d4" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-slate-400">
                                Keine Daten für {selectedYear}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-medium">Top 5 Steuerereignisse</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {taxEvents.length > 0 ? taxEvents.map(event => (
                                <div key={event.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-slate-900">
                                            {event.event_type}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(event.event_date).toLocaleDateString('de-DE')}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-medium ${event.gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {event.gain_loss >= 0 ? '+' : ''}{event.gain_loss.toFixed(2)} €
                                        </div>
                                        {event.is_tax_exempt && (
                                            <Badge variant="outline" className="text-xs mt-1">Steuerfrei</Badge>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-slate-400 py-8">
                                    Keine Ereignisse für {selectedYear}
                                </div>
                            )}
                        </div>
                        <Link to={createPageUrl('TaxEvents')}>
                            <Button variant="outline" size="sm" className="mt-4 w-full">
                                Alle Ereignisse anzeigen
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Info-Box */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                            <p className="font-medium mb-1">Steuerliche Hinweise</p>
                            <p className="text-blue-700">
                                Die hier dargestellten Berechnungen sind Schätzungen. Für eine verbindliche Steuerauskunft 
                                konsultieren Sie bitte einen Steuerberater. Export für Steuerberater verfügbar unter 
                                <Link to={createPageUrl('TaxEvents')} className="underline ml-1">Steuer-Events</Link>.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}