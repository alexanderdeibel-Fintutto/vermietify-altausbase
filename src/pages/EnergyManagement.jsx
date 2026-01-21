import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, TrendingDown, Leaf, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EnergyManagement() {
    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const energyData = Array.from({ length: 12 }, (_, i) => ({
        monat: new Date(2025, i).toLocaleDateString('de-DE', { month: 'short' }),
        verbrauch: 2500 + (Math.random() * 500 - 250),
        kosten: 450 + (Math.random() * 100 - 50)
    }));

    const totalConsumption = energyData.reduce((sum, d) => sum + d.verbrauch, 0);
    const totalCost = energyData.reduce((sum, d) => sum + d.kosten, 0);

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Energieverwaltung</h1>
                    <p className="vf-page-subtitle">Verbrauch & Effizienz</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Zap className="w-8 h-8 text-yellow-600" />
                        </div>
                        <div className="text-3xl font-bold">{totalConsumption.toFixed(0)}</div>
                        <div className="text-sm text-gray-600 mt-1">kWh (Jahr)</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{totalCost.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Energiekosten</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Leaf className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">-12%</div>
                        <div className="text-sm text-gray-600 mt-1">vs. Vorjahr</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{(totalConsumption / 12).toFixed(0)}</div>
                        <div className="text-sm opacity-90 mt-1">kWh/Monat</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Energieverbrauch & Kosten</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={energyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monat" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Line yAxisId="left" type="monotone" dataKey="verbrauch" stroke="#F59E0B" strokeWidth={2} name="kWh" />
                            <Line yAxisId="right" type="monotone" dataKey="kosten" stroke="#3B82F6" strokeWidth={2} name="Kosten €" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Energieeffizienz-Tipps</h3>
                        <div className="space-y-2">
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="font-semibold text-sm text-green-700">LED-Beleuchtung</div>
                                <div className="text-xs text-gray-600">Potenzielle Einsparung: 300€/Jahr</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="font-semibold text-sm text-green-700">Dämmung verbessern</div>
                                <div className="text-xs text-gray-600">Potenzielle Einsparung: 800€/Jahr</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Energieausweis-Status</h3>
                        <div className="space-y-2">
                            {buildings.map(b => (
                                <div key={b.id} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between">
                                        <div className="font-semibold text-sm">{b.name}</div>
                                        <Badge className="vf-badge-success">Gültig</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}