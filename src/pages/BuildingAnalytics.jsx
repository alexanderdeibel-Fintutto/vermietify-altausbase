import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Home, Users, DollarSign } from 'lucide-react';

export default function BuildingAnalytics() {
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

    const buildingStats = buildings.map(b => {
        const buildingUnits = units.filter(u => u.building_id === b.id);
        const occupiedUnits = buildingUnits.filter(u => contracts.some(c => c.unit_id === u.id));
        const totalRent = contracts
            .filter(c => buildingUnits.some(u => u.id === c.unit_id))
            .reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);

        return {
            name: b.name,
            units: buildingUnits.length,
            occupied: occupiedUnits.length,
            occupancyRate: buildingUnits.length > 0 ? (occupiedUnits.length / buildingUnits.length * 100).toFixed(0) : 0,
            monthlyRent: totalRent
        };
    });

    const COLORS = ['#1E3A8A', '#F97316', '#10B981', '#8B5CF6'];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Gebäudeanalyse</h1>
                    <p className="vf-page-subtitle">{buildings.length} Gebäude</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Home className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{buildings.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Gebäude</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold">{units.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Einheiten</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">{buildingStats.reduce((sum, b) => sum + b.monthlyRent, 0).toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ø Monatlich</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{(buildingStats.reduce((sum, b) => sum + parseInt(b.occupancyRate), 0) / buildingStats.length).toFixed(0)}%</div>
                        <div className="text-sm opacity-90 mt-1">Auslastung</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Auslastung nach Gebäude</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={buildingStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="occupied" fill="#10B981" name="Vermietet" />
                            <Bar dataKey="units" fill="#CBD5E1" name="Gesamt" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Monatliche Mieten</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={buildingStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="monthlyRent" stroke="#1E3A8A" strokeWidth={2} name="Monatliche Miete" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Gebäude-Übersicht</h3>
                        <div className="space-y-3">
                            {buildingStats.map((building, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold">{building.name}</span>
                                        <span className="text-sm text-gray-600">{building.occupancyRate}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="h-2 rounded-full bg-gradient-to-r from-blue-900 to-orange-600"
                                            style={{ width: `${building.occupancyRate}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Rentabilität</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={buildingStats}
                                    dataKey="monthlyRent"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {buildingStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}