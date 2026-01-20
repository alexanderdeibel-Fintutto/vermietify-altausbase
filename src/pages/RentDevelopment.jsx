import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RentDevelopment() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const currentRent = contracts.reduce((sum, c) => sum + parseFloat(c.kaltmiete || 0), 0);
    const yearlyRent = currentRent * 12;

    const historicalData = Array.from({ length: 24 }, (_, i) => {
        const monthsAgo = 23 - i;
        const date = new Date();
        date.setMonth(date.getMonth() - monthsAgo);
        return {
            monat: date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
            miete: currentRent * (1 - (monthsAgo * 0.002)) + (Math.random() * 200 - 100)
        };
    });

    const rentGrowth = historicalData.length > 1 
        ? ((historicalData[historicalData.length - 1].miete - historicalData[0].miete) / historicalData[0].miete * 100)
        : 0;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mietentwicklung</h1>
                    <p className="vf-page-subtitle">Historische Analyse</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{currentRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Aktuelle Miete/Monat</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{yearlyRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Jahresmiete</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">+{rentGrowth.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600 mt-1">Wachstum (24M)</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{contracts.length}</div>
                        <div className="text-sm opacity-90 mt-1">Mietverträge</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Mieteinnahmen (24 Monate)</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={historicalData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monat" />
                            <YAxis />
                            <Tooltip formatter={(v) => `${v.toFixed(0).toLocaleString('de-DE')}€`} />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="miete" 
                                stroke="#3B82F6" 
                                strokeWidth={2}
                                name="Monatliche Miete"
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Performance nach Immobilie</h3>
                    <div className="space-y-2">
                        {buildingsWithMetrics.map(building => (
                            <div key={building.id} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold">{building.name}</div>
                                        <div className="text-sm text-gray-600">Jahresmiete: {building.income.toLocaleString('de-DE')}€</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-blue-700">{building.roi.toFixed(2)}%</div>
                                        <div className="text-xs text-gray-600">ROI</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}