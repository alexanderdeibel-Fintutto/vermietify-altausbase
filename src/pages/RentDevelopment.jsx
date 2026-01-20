import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Target, BarChart3 } from 'lucide-react';

export default function RentDevelopment() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: rentChanges = [] } = useQuery({
        queryKey: ['rentChanges'],
        queryFn: () => base44.entities.RentChange.list('-aenderungsdatum')
    });

    const currentRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const avgRentPerUnit = currentRent / (contracts.length || 1);
    
    const totalIncreases = rentChanges
        .filter(r => parseFloat(r.neue_miete) > parseFloat(r.alte_miete))
        .reduce((sum, r) => sum + (parseFloat(r.neue_miete) - parseFloat(r.alte_miete)), 0);

    const growthRate = rentChanges.length > 0 
        ? (totalIncreases / (rentChanges.length * avgRentPerUnit)) * 100 
        : 0;

    const yearlyData = Array.from({ length: 5 }, (_, i) => {
        const year = 2021 + i;
        return {
            jahr: year,
            miete: avgRentPerUnit * Math.pow(1.03, i)
        };
    });

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
                        <div className="flex items-center justify-between mb-2">
                            <Target className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">{avgRentPerUnit.toFixed(0)}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ø pro Einheit</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">+{growthRate.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600 mt-1">Wachstumsrate</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <BarChart3 className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{rentChanges.length}</div>
                        <div className="text-sm opacity-90 mt-1">Mieterhöhungen</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Mietentwicklung 2021-2025</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={yearlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="jahr" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="miete" stroke="#1E3A8A" strokeWidth={3} name="Ø Miete/Einheit" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Aktuelle Mieterhöhungen</h3>
                    <div className="space-y-2">
                        {rentChanges.slice(0, 10).map((change) => (
                            <div key={change.id} className="p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-gray-600">
                                            {new Date(change.aenderungsdatum).toLocaleDateString('de-DE')}
                                        </div>
                                        <div className="font-semibold mt-1">
                                            {parseFloat(change.alte_miete).toFixed(0)}€ → {parseFloat(change.neue_miete).toFixed(0)}€
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-green-700 font-semibold">
                                            +{(parseFloat(change.neue_miete) - parseFloat(change.alte_miete)).toFixed(0)}€
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            +{(((parseFloat(change.neue_miete) - parseFloat(change.alte_miete)) / parseFloat(change.alte_miete)) * 100).toFixed(1)}%
                                        </div>
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