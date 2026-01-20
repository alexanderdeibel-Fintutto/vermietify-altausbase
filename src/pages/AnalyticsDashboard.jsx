import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, Building2, Home, Users, Euro, Percent } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#1E3A8A', '#F97316', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4'];

export default function AnalyticsDashboard() {
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

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const totalRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const totalExpenses = invoices.reduce((sum, inv) => sum + (parseFloat(inv.betrag) || 0), 0);
    const occupancyRate = units.length > 0 ? (contracts.length / units.length) * 100 : 0;

    // Rent by building
    const rentByBuilding = buildings.map(building => {
        const buildingUnits = units.filter(u => u.building_id === building.id);
        const buildingContracts = contracts.filter(c => 
            buildingUnits.some(u => u.id === c.unit_id)
        );
        const rent = buildingContracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
        return { name: building.name || 'Unbenannt', miete: rent };
    });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Analytics</h1>
                    <p className="vf-page-subtitle">Detaillierte Geschäftseinblicke</p>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{buildings.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Gebäude</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Home className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">{units.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Wohneinheiten</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Percent className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{occupancyRate.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600 mt-1">Auslastung</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Euro className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{totalRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm opacity-90 mt-1">Monatliche Miete</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Mieteinnahmen nach Gebäude</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={rentByBuilding}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="miete" fill="#1E3A8A" name="Miete (€)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Portfolio-Verteilung</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={rentByBuilding}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="miete"
                                >
                                    {rentByBuilding.map((entry, index) => (
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