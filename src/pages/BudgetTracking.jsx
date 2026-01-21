import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, Target } from 'lucide-react';
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

    const monthlyIncome = contracts.reduce((sum, c) => sum + parseFloat(c.kaltmiete || 0), 0);
    const monthlyExpenses = invoices.reduce((sum, i) => sum + parseFloat(i.betrag || 0), 0) / 12;
    const budget = monthlyIncome * 0.8;
    const budgetUsage = budget > 0 ? (monthlyExpenses / budget * 100) : 0;

    const budgetData = Array.from({ length: 6 }, (_, i) => ({
        monat: new Date(2025, i).toLocaleDateString('de-DE', { month: 'short' }),
        budget: budget,
        ausgaben: monthlyExpenses + (Math.random() * 500 - 250)
    }));

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Budget-Tracking</h1>
                    <p className="vf-page-subtitle">Planung & Kontrolle</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Target className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{budget.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Monatsbudget</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingDown className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{monthlyExpenses.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ausgaben</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-green-700">{(budget - monthlyExpenses).toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Verbleibend</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{budgetUsage.toFixed(1)}%</div>
                        <div className="text-sm opacity-90 mt-1">Ausgeschöpft</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Budget vs. Ausgaben</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={budgetData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monat" />
                            <YAxis />
                            <Tooltip formatter={(v) => `${v.toFixed(0).toLocaleString('de-DE')}€`} />
                            <Legend />
                            <Bar dataKey="budget" fill="#94A3B8" name="Budget" />
                            <Bar dataKey="ausgaben" fill="#3B82F6" name="Ausgaben" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Budget-Status</h3>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                            className={`h-4 rounded-full ${budgetUsage > 90 ? 'bg-red-600' : budgetUsage > 70 ? 'bg-orange-500' : 'bg-green-600'}`}
                            style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                        <span>0€</span>
                        <span>{budget.toLocaleString('de-DE')}€</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}