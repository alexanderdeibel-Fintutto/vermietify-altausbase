import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Euro, TrendingUp, TrendingDown, PieChart as PieIcon } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FinancialDashboard() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const { data: payments = [] } = useQuery({
        queryKey: ['actualPayments'],
        queryFn: () => base44.entities.ActualPayment.list()
    });

    const monthlyRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const totalExpenses = invoices.reduce((sum, inv) => sum + (parseFloat(inv.betrag) || 0), 0);
    const totalIncome = payments.reduce((sum, p) => sum + (parseFloat(p.betrag) || 0), 0);
    const netResult = totalIncome - totalExpenses;

    const monthlyData = [
        { month: 'Jan', einnahmen: monthlyRent, ausgaben: totalExpenses / 12 },
        { month: 'Feb', einnahmen: monthlyRent, ausgaben: totalExpenses / 12 },
        { month: 'Mär', einnahmen: monthlyRent, ausgaben: totalExpenses / 12 },
        { month: 'Apr', einnahmen: monthlyRent, ausgaben: totalExpenses / 12 },
        { month: 'Mai', einnahmen: monthlyRent, ausgaben: totalExpenses / 12 },
        { month: 'Jun', einnahmen: monthlyRent, ausgaben: totalExpenses / 12 }
    ];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Finanzen</h1>
                    <p className="vf-page-subtitle">Finanzielle Übersicht</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{totalIncome.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Einnahmen</div>
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

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Euro className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className={`text-3xl font-bold ${netResult >= 0 ? 'text-blue-900' : 'text-red-700'}`}>
                            {netResult.toLocaleString('de-DE')}€
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Netto-Ergebnis</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <PieIcon className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{monthlyRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm opacity-90 mt-1">Monatliche Miete</div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Einnahmen vs. Ausgaben (Jahresübersicht)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="einnahmen" fill="#1E3A8A" name="Einnahmen" />
                            <Bar dataKey="ausgaben" fill="#F97316" name="Ausgaben" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}