import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, FileText, TrendingUp, Download, Euro, Users, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const totalExpenses = invoices.reduce((sum, inv) => sum + (parseFloat(inv.betrag) || 0), 0);

    const monthlyData = [
        { name: 'Jan', einnahmen: 15000, ausgaben: 8000 },
        { name: 'Feb', einnahmen: 15200, ausgaben: 7500 },
        { name: 'Mär', einnahmen: 15100, ausgaben: 9200 },
        { name: 'Apr', einnahmen: 15300, ausgaben: 7800 },
        { name: 'Mai', einnahmen: 15400, ausgaben: 8500 },
        { name: 'Jun', einnahmen: 15200, ausgaben: 7200 }
    ];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Berichte & Auswertungen</h1>
                    <p className="vf-page-subtitle">Übersicht Ihrer Immobilienverwaltung</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="vf-stat-card__value">{buildings.length}</div>
                        <div className="vf-stat-card__label">Gebäude</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="vf-stat-card__value">{tenants.length}</div>
                        <div className="vf-stat-card__label">Mieter</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Euro className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="vf-stat-card__value">{totalExpenses.toLocaleString('de-DE')}€</div>
                        <div className="vf-stat-card__label">Ausgaben gesamt</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">+12%</div>
                        <div className="text-sm opacity-90">Rendite YTD</div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Einnahmen vs. Ausgaben</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="einnahmen" fill="#1E3A8A" name="Einnahmen" />
                            <Bar dataKey="ausgaben" fill="#F97316" name="Ausgaben" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Quick Reports */}
            <Card>
                <CardHeader>
                    <CardTitle>Schnellberichte</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-3">
                        <Button variant="outline" className="justify-start">
                            <FileText className="w-4 h-4" />
                            Anlage V exportieren
                        </Button>
                        <Button variant="outline" className="justify-start">
                            <Download className="w-4 h-4" />
                            Nebenkostenabrechnung
                        </Button>
                        <Button variant="outline" className="justify-start">
                            <BarChart3 className="w-4 h-4" />
                            Renditeübersicht
                        </Button>
                        <Button variant="outline" className="justify-start">
                            <FileText className="w-4 h-4" />
                            Mieterliste drucken
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}