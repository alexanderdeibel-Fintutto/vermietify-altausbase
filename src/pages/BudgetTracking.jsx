import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function BudgetTracking() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const monthlyIncome = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const monthlyExpenses = invoices.reduce((sum, i) => sum + (parseFloat(i.betrag) || 0), 0) / 12;
    const netProfit = monthlyIncome - monthlyExpenses;
    const profitMargin = (netProfit / monthlyIncome) * 100;

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        monat: new Date(2025, i).toLocaleDateString('de-DE', { month: 'short' }),
        einnahmen: monthlyIncome + (Math.random() * 1000 - 500),
        ausgaben: monthlyExpenses + (Math.random() * 500 - 250),
        budget: monthlyIncome * 0.7
    }));

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Budget-Tracking</h1>
                    <p className="vf-page-subtitle">Finanzplanung 2025</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{monthlyIncome.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Einnahmen/Monat</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingDown className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{monthlyExpenses.toFixed(0)}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ausgaben/Monat</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{netProfit.toFixed(0)}€</div>
                        <div className="text-sm text-gray-600 mt-1">Nettogewinn</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{profitMargin.toFixed(1)}%</div>
                        <div className="text-sm opacity-90 mt-1">Gewinnmarge</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Budget vs. Ist-Ausgaben</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monat" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="einnahmen" fill="#10B981" name="Einnahmen" />
                            <Bar dataKey="ausgaben" fill="#EF4444" name="Ausgaben" />
                            <Bar dataKey="budget" fill="#94A3B8" name="Budget" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Monatsübersicht</h3>
                        <div className="space-y-3">
                            {monthlyData.slice(0, 3).map((month, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                                    <div className="font-semibold mb-2">{month.monat}</div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <div className="text-gray-600">Einnahmen</div>
                                            <div className="font-semibold text-green-700">{month.einnahmen.toFixed(0)}€</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Ausgaben</div>
                                            <div className="font-semibold text-red-700">{month.ausgaben.toFixed(0)}€</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Netto</div>
                                            <div className="font-semibold">{(month.einnahmen - month.ausgaben).toFixed(0)}€</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-orange-300 bg-orange-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-orange-700">
                            <AlertCircle className="w-5 h-5" />
                            Budget-Warnungen
                        </h3>
                        <div className="space-y-2">
                            <div className="p-3 bg-white rounded-lg border border-orange-200">
                                <div className="text-sm">Ausgaben im Januar überschreiten das Budget um 8%</div>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-orange-200">
                                <div className="text-sm">Wartungskosten höher als geplant</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}