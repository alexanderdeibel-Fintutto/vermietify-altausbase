import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, Home, Users, Euro, TrendingUp, MapPin } from 'lucide-react';
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

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const totalRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const totalArea = units.reduce((sum, u) => sum + (parseFloat(u.flaeche) || 0), 0);
    const occupancyRate = units.length > 0 ? (contracts.length / units.length) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Portfolio-Übersicht</h1>
                    <p className="vf-page-subtitle">Gesamtübersicht Ihrer Immobilien</p>
                </div>
            </div>

            {/* Overview Stats */}
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
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold">{tenants.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Mieter</div>
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

            {/* Additional Metrics */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-sm text-gray-500 mb-2">Gesamtfläche</div>
                        <div className="text-2xl font-bold">{totalArea.toLocaleString('de-DE')} m²</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-sm text-gray-500 mb-2">Vermietungsquote</div>
                        <div className="text-2xl font-bold text-green-600">{occupancyRate.toFixed(1)}%</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-sm text-gray-500 mb-2">Jahres-Mieteinnahmen</div>
                        <div className="text-2xl font-bold text-blue-900">{(totalRent * 12).toLocaleString('de-DE')}€</div>
                    </CardContent>
                </Card>
            </div>

            {/* Buildings Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Gebäude im Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                    {buildings.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Noch keine Gebäude</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {buildings.map((building) => {
                                const buildingUnits = units.filter(u => u.building_id === building.id);
                                const buildingContracts = contracts.filter(c => 
                                    buildingUnits.some(u => u.id === c.unit_id)
                                );
                                const buildingRent = buildingContracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);

                                return (
                                    <Link key={building.id} to={createPageUrl('BuildingDetail') + `?id=${building.id}`}>
                                        <Card className="vf-card-clickable">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <Building2 className="w-10 h-10 text-blue-600" />
                                                        <div>
                                                            <h3 className="font-semibold">{building.name}</h3>
                                                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {building.ort}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                                                                <span>{buildingUnits.length} Einheiten</span>
                                                                <span>•</span>
                                                                <span>{buildingContracts.length} Mieter</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-semibold text-lg text-green-700">{buildingRent.toLocaleString('de-DE')}€</div>
                                                        <div className="text-xs text-gray-500">pro Monat</div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}