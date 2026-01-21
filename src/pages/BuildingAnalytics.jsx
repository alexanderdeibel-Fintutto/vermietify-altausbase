import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, DollarSign, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

    const totalValue = buildings.reduce((sum, b) => sum + parseFloat(b.kaufpreis || 0), 0);
    const avgValue = buildings.length > 0 ? totalValue / buildings.length : 0;

    const buildingData = buildings.map(b => ({
        name: b.name,
        einheiten: units.filter(u => u.building_id === b.id).length,
        wert: parseFloat(b.kaufpreis || 0)
    }));

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Gebäude-Analytics</h1>
                    <p className="vf-page-subtitle">Portfolio-Übersicht</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
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
                        <div className="text-3xl font-bold">{units.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Einheiten</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{totalValue.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamtwert</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{avgValue.toLocaleString('de-DE')}€</div>
                        <div className="text-sm opacity-90 mt-1">Ø Wert/Gebäude</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Gebäudewert-Verteilung</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={buildingData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(v) => `${v.toLocaleString('de-DE')}€`} />
                            <Bar dataKey="wert" fill="#3B82F6" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Gebäudedetails</h3>
                    <div className="space-y-2">
                        {buildings.map(b => {
                            const buildingUnits = units.filter(u => u.building_id === b.id);
                            const buildingContracts = contracts.filter(c => c.building_id === b.id);
                            return (
                                <div key={b.id} className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-semibold">{b.name}</div>
                                            <div className="text-sm text-gray-600">{b.strasse}, {b.plz} {b.stadt}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">{buildingUnits.length} Einheiten</div>
                                            <div className="text-sm text-gray-600">{buildingContracts.length} vermietet</div>
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