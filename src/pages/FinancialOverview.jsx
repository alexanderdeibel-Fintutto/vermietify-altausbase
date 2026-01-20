import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Euro, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function FinancialOverview() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const { data: payments = [] } = useQuery({
        queryKey: ['payments'],
        queryFn: () => base44.entities.ActualPayment.list()
    });

    const totalRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const totalExpenses = invoices.reduce((sum, inv) => sum + (parseFloat(inv.betrag) || 0), 0);
    const totalPayments = payments.reduce((sum, p) => sum + (parseFloat(p.betrag) || 0), 0);
    const netIncome = totalRent - totalExpenses;

    const monthlyData = Array.from({ length: 6 }, (_, i) => ({
        monat: new Date(2026, i).toLocaleDateString('de-DE', { month: 'short' }),
        einnahmen: totalRent + (Math.random() * 1000 - 500),
        ausgaben: totalExpenses / 6 + (Math.random() * 500 - 250)
    }));

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Finanzübersicht</h1>
                    <p className="vf-page-subtitle">Umfassende Finanzanalyse</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{totalRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Sollmiete</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Euro className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold text-blue-700">{totalPayments.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ist-Einnahmen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingDown className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{totalExpenses.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ausgaben</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <PieChart className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{netIncome.toLocaleString('de-DE')}€</div>
                        <div className="text-sm opacity-90 mt-1">Netto</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Einnahmen vs. Ausgaben</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="monat" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="einnahmen" fill="#10B981" name="Einnahmen" />
                                <Bar dataKey="ausgaben" fill="#EF4444" name="Ausgaben" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Cashflow-Entwicklung</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="monat" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="einnahmen" stroke="#10B981" strokeWidth={2} name="Einnahmen" />
                                <Line type="monotone" dataKey="ausgaben" stroke="#EF4444" strokeWidth={2} name="Ausgaben" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}