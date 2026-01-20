import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Calendar, Target, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function FinancialForecasting() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const monthlyRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const avgMonthlyExpenses = invoices.reduce((sum, inv) => sum + (parseFloat(inv.betrag) || 0), 0) / 12;

    const forecastData = Array.from({ length: 12 }, (_, i) => ({
        monat: new Date(2026, i).toLocaleDateString('de-DE', { month: 'short' }),
        einnahmen: monthlyRent + (Math.random() * 500 - 250),
        ausgaben: avgMonthlyExpenses + (Math.random() * 300 - 150),
        netto: (monthlyRent - avgMonthlyExpenses) + (Math.random() * 400 - 200)
    }));

    const yearlyForecast = forecastData.reduce((sum, d) => sum + d.netto, 0);

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Finanzprognose</h1>
                    <p className="vf-page-subtitle">12-Monats-Forecast</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{monthlyRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ø Einnahmen/Monat</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Target className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{avgMonthlyExpenses.toFixed(0)}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ø Ausgaben/Monat</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Calendar className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{(monthlyRent - avgMonthlyExpenses).toFixed(0)}€</div>
                        <div className="text-sm text-gray-600 mt-1">Netto/Monat</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{yearlyForecast.toFixed(0)}€</div>
                        <div className="text-sm opacity-90 mt-1">Prognose 2026</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Cashflow-Prognose 2026</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={forecastData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monat" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="einnahmen" stroke="#10B981" strokeWidth={2} name="Einnahmen" />
                            <Line type="monotone" dataKey="ausgaben" stroke="#EF4444" strokeWidth={2} name="Ausgaben" />
                            <Line type="monotone" dataKey="netto" stroke="#1E3A8A" strokeWidth={3} name="Netto" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Monatliche Prognose</h3>
                    <div className="overflow-x-auto">
                        <table className="vf-table">
                            <thead>
                                <tr>
                                    <th>Monat</th>
                                    <th>Einnahmen</th>
                                    <th>Ausgaben</th>
                                    <th>Netto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {forecastData.map((data, idx) => (
                                    <tr key={idx}>
                                        <td className="font-semibold">{data.monat}</td>
                                        <td className="vf-table-cell-currency text-green-700">{data.einnahmen.toFixed(0)}€</td>
                                        <td className="vf-table-cell-currency text-red-700">{data.ausgaben.toFixed(0)}€</td>
                                        <td className="vf-table-cell-currency font-bold">{data.netto.toFixed(0)}€</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}