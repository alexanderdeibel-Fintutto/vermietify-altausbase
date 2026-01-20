import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { TrendingUp, TrendingDown, Euro, FileText, Download, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#1E3A8A', '#F97316', '#10B981', '#8B5CF6', '#EF4444'];

export default function FinancialReporting() {
    const [startDate, setStartDate] = useState('2024-01-01');
    const [endDate, setEndDate] = useState('2024-12-31');

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    // Calculate metrics
    const totalExpenses = invoices.reduce((sum, inv) => sum + (parseFloat(inv.betrag) || 0), 0);
    const monthlyRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const annualRent = monthlyRent * 12;
    const netIncome = annualRent - totalExpenses;

    // Monthly data
    const monthlyData = [
        { month: 'Jan', einnahmen: monthlyRent, ausgaben: totalExpenses / 12 },
        { month: 'Feb', einnahmen: monthlyRent, ausgaben: totalExpenses / 12 },
        { month: 'Mär', einnahmen: monthlyRent, ausgaben: totalExpenses / 12 },
        { month: 'Apr', einnahmen: monthlyRent, ausgaben: totalExpenses / 12 },
        { month: 'Mai', einnahmen: monthlyRent, ausgaben: totalExpenses / 12 },
        { month: 'Jun', einnahmen: monthlyRent, ausgaben: totalExpenses / 12 },
    ];

    // Expense categories
    const expenseData = [
        { name: 'Reparaturen', value: totalExpenses * 0.4 },
        { name: 'Versicherung', value: totalExpenses * 0.25 },
        { name: 'Verwaltung', value: totalExpenses * 0.2 },
        { name: 'Sonstiges', value: totalExpenses * 0.15 }
    ];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Finanzberichte</h1>
                    <p className="vf-page-subtitle">Übersicht Ihrer Einnahmen und Ausgaben</p>
                </div>
                <div className="vf-page-actions">
                    <Button variant="outline">
                        <Download className="w-4 h-4" />
                        PDF exportieren
                    </Button>
                </div>
            </div>

            {/* Date Filter */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <VfInput
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="max-w-xs"
                        />
                        <span className="text-gray-500">bis</span>
                        <VfInput
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="max-w-xs"
                        />
                        <Button>Aktualisieren</Button>
                    </div>
                </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{annualRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Jahres-Einnahmen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingDown className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{totalExpenses.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Jahres-Ausgaben</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Euro className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold text-blue-900">{netIncome.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Netto-Ertrag</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">
                            {totalExpenses > 0 ? ((netIncome / annualRent) * 100).toFixed(1) : 0}%
                        </div>
                        <div className="text-sm opacity-90 mt-1">Rendite</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Einnahmen vs. Ausgaben</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
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

                <Card>
                    <CardHeader>
                        <CardTitle>Ausgaben nach Kategorie</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={expenseData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {expenseData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}