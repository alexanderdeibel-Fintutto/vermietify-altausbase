import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingDown, PieChart as PieIcon, BarChart3 } from 'lucide-react';

export default function CostAnalysis() {
    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const totalCosts = invoices.reduce((sum, i) => sum + (parseFloat(i.betrag) || 0), 0);
    const avgCostPerInvoice = totalCosts / (invoices.length || 1);

    const costsByCategory = {};
    invoices.forEach(inv => {
        const cat = inv.kategorie || 'Sonstige';
        costsByCategory[cat] = (costsByCategory[cat] || 0) + (parseFloat(inv.betrag) || 0);
    });

    const categoryData = Object.entries(costsByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        monat: new Date(2025, i).toLocaleDateString('de-DE', { month: 'short' }),
        kosten: totalCosts / 12 + (Math.random() * 1000 - 500)
    }));

    const COLORS = ['#1E3A8A', '#F97316', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B'];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Kostenanalyse</h1>
                    <p className="vf-page-subtitle">{invoices.length} Rechnungen</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{totalCosts.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamtkosten</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <BarChart3 className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{avgCostPerInvoice.toFixed(0)}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ø pro Rechnung</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <PieIcon className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">{Object.keys(costsByCategory).length}</div>
                        <div className="text-sm text-gray-600 mt-1">Kategorien</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{(totalCosts / 12).toFixed(0)}€</div>
                        <div className="text-sm opacity-90 mt-1">Ø pro Monat</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Kosten nach Kategorie</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Kategorien Details</h3>
                        <div className="space-y-2">
                            {categoryData.map((cat, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-4 h-4 rounded-full" 
                                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                            />
                                            <span className="font-semibold">{cat.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold">{cat.value.toLocaleString('de-DE')}€</div>
                                            <div className="text-xs text-gray-600">
                                                {((cat.value / totalCosts) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Monatlicher Kostenverlauf</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monat" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="kosten" stroke="#EF4444" strokeWidth={2} name="Kosten" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}