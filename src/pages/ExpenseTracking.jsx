import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingDown, Filter, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

export default function ExpenseTracking() {
    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list('-created_date')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const totalExpenses = invoices.reduce((sum, i) => sum + (parseFloat(i.betrag) || 0), 0);
    const monthlyAverage = totalExpenses / 12;
    
    const expensesByCategory = invoices.reduce((acc, i) => {
        const category = i.kategorie || 'Sonstige';
        const existing = acc.find(c => c.name === category);
        if (existing) {
            existing.value += parseFloat(i.betrag) || 0;
        } else {
            acc.push({ name: category, value: parseFloat(i.betrag) || 0 });
        }
        return acc;
    }, []);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    const topExpenses = [...invoices].sort((a, b) => parseFloat(b.betrag) - parseFloat(a.betrag)).slice(0, 10);

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Ausgabenverfolgung</h1>
                    <p className="vf-page-subtitle">{invoices.length} Ausgaben erfasst</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        Neue Ausgabe
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{totalExpenses.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamtausgaben</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingDown className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{monthlyAverage.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Monatlich Ø</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{invoices.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Transaktionen</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{expensesByCategory.length}</div>
                        <div className="text-sm opacity-90 mt-1">Kategorien</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Ausgaben nach Kategorie</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={expensesByCategory}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {expensesByCategory.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value.toLocaleString('de-DE')}€`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Größte Ausgaben</h3>
                    <div className="space-y-2">
                        {topExpenses.map((expense) => {
                            const building = buildings.find(b => b.id === expense.building_id);
                            return (
                                <div key={expense.id} className="p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-sm">{expense.kategorie || 'Sonstige'}</div>
                                            <div className="text-xs text-gray-600">{building?.name}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">{expense.betrag.toLocaleString('de-DE')}€</div>
                                            <Badge className="vf-badge-primary text-xs mt-1">{expense.status}</Badge>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}