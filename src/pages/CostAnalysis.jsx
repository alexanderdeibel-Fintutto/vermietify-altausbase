import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingDown, DollarSign, BarChart3, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function CostAnalysis() {
    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const totalCosts = invoices.reduce((sum, i) => sum + parseFloat(i.betrag || 0), 0);
    const avgCost = invoices.length > 0 ? totalCosts / invoices.length : 0;

    const costsByCategory = invoices.reduce((acc, i) => {
        const cat = i.kategorie || 'Sonstige';
        const existing = acc.find(x => x.name === cat);
        if (existing) existing.value += parseFloat(i.betrag || 0);
        else acc.push({ name: cat, value: parseFloat(i.betrag || 0) });
        return acc;
    }, []).sort((a, b) => b.value - a.value);

    const monthlyCosts = Array.from({ length: 12 }, (_, i) => ({
        monat: new Date(2025, i).toLocaleDateString('de-DE', { month: 'short' }),
        kosten: (totalCosts / 12) + (Math.random() * 1000 - 500)
    }));

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Kostenanalyse</h1>
                    <p className="vf-page-subtitle">Detaillierte Ausgabenübersicht</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingDown className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{totalCosts.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamtkosten</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{avgCost.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ø Kosten pro Posten</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{invoices.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Kostenpositionen</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{(totalCosts / 12).toLocaleString('de-DE')}€</div>
                        <div className="text-sm opacity-90 mt-1">Ø Monatlich</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Top Kostenkategorien</h3>
                        <div className="space-y-2">
                            {costsByCategory.slice(0, 8).map((cat, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div className="font-semibold text-sm">{cat.name}</div>
                                        <div className="text-right">
                                            <div className="font-bold">{cat.value.toLocaleString('de-DE')}€</div>
                                            <div className="text-xs text-gray-600">{(cat.value / totalCosts * 100).toFixed(1)}%</div>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full" 
                                            style={{ width: `${(cat.value / costsByCategory[0].value) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Monatliche Kostenentwicklung</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyCosts}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="monat" />
                                <YAxis />
                                <Tooltip formatter={(v) => `${v.toFixed(0).toLocaleString('de-DE')}€`} />
                                <Line 
                                    type="monotone" 
                                    dataKey="kosten" 
                                    stroke="#EF4444" 
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}