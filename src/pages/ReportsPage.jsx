import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, TrendingUp, Building2, Users, Euro } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const totalRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const totalExpenses = invoices.reduce((sum, inv) => sum + (parseFloat(inv.betrag) || 0), 0);
    const netIncome = totalRent - totalExpenses;

    const monthlyData = [
        { month: 'Jan', einnahmen: 15000, ausgaben: 8000 },
        { month: 'Feb', einnahmen: 15200, ausgaben: 7500 },
        { month: 'Mar', einnahmen: 15800, ausgaben: 9200 },
        { month: 'Apr', einnahmen: 16000, ausgaben: 8800 },
        { month: 'Mai', einnahmen: 16200, ausgaben: 7900 },
        { month: 'Jun', einnahmen: 16500, ausgaben: 8500 }
    ];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Berichte & Auswertungen</h1>
                    <p className="vf-page-subtitle">Geschäftsanalysen & Statistiken</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Download className="w-4 h-4" />
                        Export PDF
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{totalRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Mieteinnahmen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Euro className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{totalExpenses.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ausgaben</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{netIncome.toLocaleString('de-DE')}€</div>
                        <div className="text-sm opacity-90 mt-1">Netto-Einkommen</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Einnahmen vs. Ausgaben</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="einnahmen" fill="#10B981" name="Einnahmen" />
                            <Bar dataKey="ausgaben" fill="#EF4444" name="Ausgaben" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Entwicklung</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="einnahmen" stroke="#10B981" strokeWidth={2} name="Einnahmen" />
                            <Line type="monotone" dataKey="ausgaben" stroke="#EF4444" strokeWidth={2} name="Ausgaben" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Building2 className="w-8 h-8 text-blue-600" />
                            <h3 className="font-semibold">Gebäude</h3>
                        </div>
                        <div className="text-2xl font-bold">{buildings.length}</div>
                        <Button variant="outline" size="sm" className="mt-3 w-full">
                            <Download className="w-4 h-4" />
                            Bericht herunterladen
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <FileText className="w-8 h-8 text-purple-600" />
                            <h3 className="font-semibold">Verträge</h3>
                        </div>
                        <div className="text-2xl font-bold">{contracts.length}</div>
                        <Button variant="outline" size="sm" className="mt-3 w-full">
                            <Download className="w-4 h-4" />
                            Bericht herunterladen
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Euro className="w-8 h-8 text-green-600" />
                            <h3 className="font-semibold">Finanzen</h3>
                        </div>
                        <div className="text-2xl font-bold">{totalRent.toLocaleString('de-DE')}€</div>
                        <Button variant="outline" size="sm" className="mt-3 w-full">
                            <Download className="w-4 h-4" />
                            Bericht herunterladen
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}