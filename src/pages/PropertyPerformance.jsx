import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, TrendingUp, Target, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PropertyPerformance() {
    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const performanceData = buildings.map(building => {
        const buildingUnits = units.filter(u => u.building_id === building.id);
        const buildingContracts = contracts.filter(c => 
            buildingUnits.some(u => u.id === c.unit_id)
        );
        const totalRent = buildingContracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
        const occupancy = buildingUnits.length > 0 ? (buildingContracts.length / buildingUnits.length * 100) : 0;
        const performance = (occupancy / 100) * (totalRent / 1000);

        return {
            name: building.name,
            leistung: performance,
            auslastung: occupancy,
            miete: totalRent
        };
    }).sort((a, b) => b.leistung - a.leistung);

    const topPerformer = performanceData[0];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Objektperformance</h1>
                    <p className="vf-page-subtitle">Leistungsanalyse Ihrer Immobilien</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{buildings.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Objekte</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Target className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">
                            {(performanceData.reduce((sum, d) => sum + d.auslastung, 0) / performanceData.length || 0).toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Ø Auslastung</div>
                    </CardContent>
                </Card>

                {topPerformer && (
                    <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <Award className="w-8 h-8" />
                            </div>
                            <div className="text-lg font-bold truncate">{topPerformer.name}</div>
                            <div className="text-sm opacity-90 mt-1">Top-Performer</div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Performance-Ranking</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={performanceData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={150} />
                            <Tooltip />
                            <Bar dataKey="leistung" fill="#1E3A8A" name="Performance-Score" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="space-y-3">
                {performanceData.map((data, index) => (
                    <Card key={index}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                                        index === 0 ? 'bg-yellow-500' :
                                        index === 1 ? 'bg-gray-400' :
                                        index === 2 ? 'bg-orange-600' :
                                        'bg-blue-600'
                                    }`}>
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{data.name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                                            <span>Auslastung: {data.auslastung.toFixed(0)}%</span>
                                            <span>•</span>
                                            <span>Miete: {data.miete.toFixed(0)}€</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-blue-700">
                                    {data.leistung.toFixed(1)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}