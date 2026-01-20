import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function FinancialSummary() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const monthlyIncome = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const yearlyIncome = monthlyIncome * 12;
    const totalExpenses = invoices.reduce((sum, i) => sum + (parseFloat(i.betrag) || 0), 0);
    const netProfit = yearlyIncome - totalExpenses;
    const profitMargin = yearlyIncome > 0 ? (netProfit / yearlyIncome * 100) : 0;

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        monat: new Date(2025, i).toLocaleDateString('de-DE', { month: 'short' }),
        einnahmen: monthlyIncome + (Math.random() * 500 - 250),
        ausgaben: (totalExpenses / 12) + (Math.random() * 300 - 150),
        netto: monthlyIncome - (totalExpenses / 12)
    }));

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Finanzübersicht</h1>
                    <p className="vf-page-subtitle">Einnahmen, Ausgaben & Gewinn</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{yearlyIncome.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Jahreseinnahmen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingDown className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{totalExpenses.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Jahresausgaben</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{netProfit.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Nettogewinn</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{profitMargin.toFixed(1)}%</div>
                        <div className="text-sm opacity-90 mt-1">Gewinnmarge</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Monatliche Entwicklung</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monat" />
                            <YAxis />
                            <Tooltip formatter={(value) => `${value.toFixed(0)}€`} />
                            <Legend />
                            <Line type="monotone" dataKey="einnahmen" stroke="#10B981" strokeWidth={2} name="Einnahmen" />
                            <Line type="monotone" dataKey="ausgaben" stroke="#EF4444" strokeWidth={2} name="Ausgaben" />
                            <Line type="monotone" dataKey="netto" stroke="#3B82F6" strokeWidth={2} name="Netto" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Immobilien-Performance</h3>
                    <div className="space-y-2">
                        {buildings.map((building) => {
                            const buildingContracts = contracts.filter(c => c.building_id === building.id);
                            const buildingIncome = buildingContracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0) * 12;
                            const buildingExpenses = invoices.filter(i => i.building_id === building.id).reduce((sum, i) => sum + (parseFloat(i.betrag) || 0), 0);
                            const buildingProfit = buildingIncome - buildingExpenses;
                            
                            return (
                                <div key={building.id} className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="font-semibold mb-3">{building.name}</div>
                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                        <div>
                                            <div className="text-gray-600">Einnahmen</div>
                                            <div className="font-semibold text-green-700">{buildingIncome.toLocaleString('de-DE')}€</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Ausgaben</div>
                                            <div className="font-semibold text-red-700">{buildingExpenses.toLocaleString('de-DE')}€</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Gewinn</div>
                                            <div className={`font-semibold ${buildingProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                                                {buildingProfit.toLocaleString('de-DE')}€
                                            </div>
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