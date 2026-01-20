import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

export default function FinancialOverview() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const income = contracts.reduce((sum, c) => sum + parseFloat(c.kaltmiete || 0), 0) * 12;
    const expenses = invoices.reduce((sum, i) => sum + parseFloat(i.betrag || 0), 0);
    const netProfit = income - expenses;

    const categoryData = invoices.reduce((acc, i) => {
        const cat = i.kategorie || 'Sonstige';
        const existing = acc.find(x => x.name === cat);
        if (existing) existing.value += parseFloat(i.betrag || 0);
        else acc.push({ name: cat, value: parseFloat(i.betrag || 0) });
        return acc;
    }, []);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Finanzübersicht</h1>
                    <p className="vf-page-subtitle">Komplette Finanzanalyse</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{income.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Jahreseinnahmen</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingDown className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{expenses.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Jahresausgaben</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{netProfit.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Nettogewinn</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{((netProfit / income) * 100).toFixed(1)}%</div>
                        <div className="text-sm opacity-90 mt-1">Gewinnmarge</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Ausgaben nach Kategorie</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsPie>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    label
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v) => `${v.toLocaleString('de-DE')}€`} />
                            </RechartsPie>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Einnahmen vs. Ausgaben</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={[
                                { typ: 'Einnahmen', betrag: income },
                                { typ: 'Ausgaben', betrag: expenses },
                                { typ: 'Gewinn', betrag: netProfit }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="typ" />
                                <YAxis />
                                <Tooltip formatter={(v) => `${v.toLocaleString('de-DE')}€`} />
                                <Bar dataKey="betrag" fill="#3B82F6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}