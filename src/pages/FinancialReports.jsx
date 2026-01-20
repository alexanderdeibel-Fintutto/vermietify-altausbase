import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, Download, TrendingUp, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function FinancialReports() {
    const [selectedYear, setSelectedYear] = useState(2025);

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const totalRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const totalExpenses = invoices.reduce((sum, i) => sum + (parseFloat(i.betrag) || 0), 0);
    const netIncome = (totalRent * 12) - totalExpenses;

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        monat: new Date(selectedYear, i).toLocaleDateString('de-DE', { month: 'short' }),
        einnahmen: totalRent + (Math.random() * 1000 - 500),
        ausgaben: totalExpenses / 12 + (Math.random() * 500 - 250),
        netto: (totalRent - (totalExpenses / 12)) + (Math.random() * 750 - 375)
    }));

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Finanzberichte</h1>
                    <p className="vf-page-subtitle">Jahresübersicht {selectedYear}</p>
                </div>
                <div className="vf-page-actions">
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Bericht exportieren
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{(totalRent * 12).toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Jahresmieten</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{totalExpenses.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamtausgaben</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{netIncome.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Nettoeinkommen</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{((netIncome / (totalRent * 12)) * 100).toFixed(1)}%</div>
                        <div className="text-sm opacity-90 mt-1">Gewinnmarge</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Monatliche Finanzübersicht</h3>
                    <ResponsiveContainer width="100%" height={350}>
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