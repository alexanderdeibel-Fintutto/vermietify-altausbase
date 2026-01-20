import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { VfSelect } from '@/components/shared/VfSelect';
import { Receipt, TrendingDown, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ExpenseTracking() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const yearInvoices = invoices.filter(inv => 
        new Date(inv.rechnungsdatum).getFullYear() === parseInt(selectedYear)
    );

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthInvoices = yearInvoices.filter(inv => 
            new Date(inv.rechnungsdatum).getMonth() + 1 === month
        );
        return {
            monat: new Date(2025, i).toLocaleDateString('de-DE', { month: 'short' }),
            ausgaben: monthInvoices.reduce((sum, inv) => sum + (parseFloat(inv.betrag) || 0), 0)
        };
    });

    const totalExpenses = yearInvoices.reduce((sum, inv) => sum + (parseFloat(inv.betrag) || 0), 0);
    const avgMonthly = totalExpenses / 12;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Ausgabenverfolgung</h1>
                    <p className="vf-page-subtitle">{yearInvoices.length} Ausgaben in {selectedYear}</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-4">
                    <VfSelect
                        label="Jahr"
                        value={selectedYear}
                        onChange={setSelectedYear}
                        options={[
                            { value: '2026', label: '2026' },
                            { value: '2025', label: '2025' },
                            { value: '2024', label: '2024' }
                        ]}
                    />
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Receipt className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{totalExpenses.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamt {selectedYear}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Calendar className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{avgMonthly.toFixed(0)}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ø pro Monat</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingDown className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{yearInvoices.length}</div>
                        <div className="text-sm opacity-90 mt-1">Rechnungen</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Monatliche Ausgaben</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monat" />
                            <YAxis />
                            <Tooltip formatter={(value) => `${value.toFixed(2)}€`} />
                            <Bar dataKey="ausgaben" fill="#EF4444" name="Ausgaben (€)" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}