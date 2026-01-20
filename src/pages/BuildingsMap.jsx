import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Building2, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BuildingsMap() {
    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const buildingsWithStats = buildings.map(building => {
        const buildingUnits = units.filter(u => u.building_id === building.id);
        return {
            ...building,
            unitCount: buildingUnits.length
        };
    });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Standortkarte</h1>
                    <p className="vf-page-subtitle">{buildings.length} Standorte</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-8">
                    <div className="text-center mb-8">
                        <MapPin className="w-20 h-20 mx-auto mb-4 text-blue-600" />
                        <h3 className="text-xl font-semibold mb-2">Kartenansicht</h3>
                        <p className="text-gray-600">Ihre Immobilien auf einen Blick</p>
                    </div>

                    <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                        <div className="text-center">
                            <MapPin className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                            <p className="text-gray-500">Interaktive Karte wird hier angezeigt</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {buildingsWithStats.map((building) => (
                    <Link key={building.id} to={createPageUrl('BuildingDetail') + `?id=${building.id}`}>
                        <Card className="vf-card-clickable">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-3 mb-4">
                                    <MapPin className="w-6 h-6 text-blue-600" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1">{building.name}</h3>
                                        <p className="text-sm text-gray-600">
                                            {building.strasse}<br />
                                            {building.plz} {building.ort}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t">
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <Home className="w-4 h-4" />
                                        {building.unitCount} Einheiten
                                    </div>
                                    <div className="text-xs text-gray-500">{building.land}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}