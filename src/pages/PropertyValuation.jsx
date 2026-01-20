import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PropertyValuation() {
    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const totalPropertyValue = buildings.reduce((sum, b) => sum + (parseFloat(b.kaufpreis) || 0), 0);
    const averagePropertyValue = buildings.length > 0 ? totalPropertyValue / buildings.length : 0;
    const totalMonthlyRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const yieldPercentage = totalPropertyValue > 0 ? ((totalMonthlyRent * 12) / totalPropertyValue * 100) : 0;

    const valuationData = Array.from({ length: 12 }, (_, i) => {
        const month = new Date(2024, i).toLocaleDateString('de-DE', { month: 'short' });
        return {
            monat: month,
            wert: totalPropertyValue * (1 + (Math.random() * 0.02 - 0.01))
        };
    });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Immobilienbewertung</h1>
                    <p className="vf-page-subtitle">Portfolio-Wert & Rendite-Analyse</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{totalPropertyValue.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamtwert</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{totalMonthlyRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Monatliche Mieteinnahmen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <BarChart3 className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold text-purple-700">{yieldPercentage.toFixed(2)}%</div>
                        <div className="text-sm text-gray-600 mt-1">Rendite</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{buildings.length}</div>
                        <div className="text-sm opacity-90 mt-1">Immobilien</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Wertenwicklung (12 Monate)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={valuationData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monat" />
                            <YAxis />
                            <Tooltip formatter={(value) => `${value.toLocaleString('de-DE')}€`} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="wert"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                dot={false}
                                name="Gesamtwert"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Immobilien-Übersicht</h3>
                    <div className="space-y-2">
                        {buildings.map((building) => {
                            const buildingContracts = contracts.filter(c => c.building_id === building.id);
                            const buildingRent = buildingContracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
                            const buildingYield = building.kaufpreis > 0 ? ((buildingRent * 12) / building.kaufpreis * 100) : 0;
                            
                            return (
                                <div key={building.id} className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <div className="font-semibold">{building.name}</div>
                                            <div className="text-sm text-gray-600">{building.adresse}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold">{building.kaufpreis.toLocaleString('de-DE')}€</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                                        <div>
                                            <div className="text-gray-600">Einheiten</div>
                                            <div className="font-semibold">{buildingContracts.length}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Monatliche Miete</div>
                                            <div className="font-semibold text-green-700">{buildingRent.toLocaleString('de-DE')}€</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Rendite</div>
                                            <div className="font-semibold text-blue-700">{buildingYield.toFixed(2)}%</div>
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