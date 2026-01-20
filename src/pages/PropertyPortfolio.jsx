import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, MapPin, TrendingUp, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PropertyPortfolio() {
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

    const totalValue = buildings.reduce((sum, b) => sum + (parseFloat(b.kaufpreis) || 0), 0);
    const totalRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const avgYield = totalValue > 0 ? ((totalRent * 12) / totalValue) * 100 : 0;

    const portfolioData = buildings.map(b => ({
        name: b.name,
        value: parseFloat(b.kaufpreis) || 0
    }));

    const COLORS = ['#1E3A8A', '#F97316', '#10B981', '#8B5CF6'];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Immobilienportfolio</h1>
                    <p className="vf-page-subtitle">{buildings.length} Immobilien</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{buildings.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Immobilien</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold">{(totalValue / 1000000).toFixed(1)}M€</div>
                        <div className="text-sm text-gray-600 mt-1">Portfoliowert</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold text-purple-700">{avgYield.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600 mt-1">Ø Rendite</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{(totalRent * 12).toLocaleString('de-DE')}€</div>
                        <div className="text-sm opacity-90 mt-1">Jahresmieten</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Portfolio-Verteilung</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={portfolioData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {portfolioData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Immobilien</h3>
                        <div className="space-y-2">
                            {buildings.map((building) => {
                                const buildingUnits = units.filter(u => u.building_id === building.id);
                                const buildingContracts = contracts.filter(c => 
                                    buildingUnits.some(u => u.id === c.unit_id)
                                );
                                const buildingRent = buildingContracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
                                
                                return (
                                    <Link key={building.id} to={createPageUrl('BuildingDetail') + '?id=' + building.id}>
                                        <div className="p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition cursor-pointer">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold">{building.name}</div>
                                                    <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {building.strasse}, {building.plz} {building.ort}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold text-green-700">{buildingRent.toLocaleString('de-DE')}€</div>
                                                    <div className="text-xs text-gray-600">/Monat</div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}