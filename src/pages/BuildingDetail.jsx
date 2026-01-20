import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Home, Users, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BuildingDetail() {
    const params = new URLSearchParams(window.location.search);
    const buildingId = params.get('id');

    const { data: building, isLoading } = useQuery({
        queryKey: ['building', buildingId],
        queryFn: async () => {
            const buildings = await base44.entities.Building.filter({ id: buildingId });
            return buildings[0];
        },
        enabled: !!buildingId
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units', buildingId],
        queryFn: () => base44.entities.Unit.filter({ building_id: buildingId }),
        enabled: !!buildingId
    });

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    if (!building) {
        return <div className="text-center py-20">Gebäude nicht gefunden</div>;
    }

    return (
        <div className="space-y-6">
            <Link to={createPageUrl('Buildings')} className="vf-page-back">
                <ArrowLeft className="w-4 h-4" />
                Zurück zu Gebäude
            </Link>

            {/* Header */}
            <div className="vf-detail-header">
                <div className="vf-detail-header__top">
                    <div className="flex items-center gap-4">
                        <div className="vf-detail-header__icon">
                            <Building2 className="w-7 h-7" />
                        </div>
                        <div className="vf-detail-header__info">
                            <h1 className="vf-detail-header__title">{building.name}</h1>
                            <p className="vf-detail-header__subtitle">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                {building.strasse} {building.hausnummer}, {building.plz} {building.ort}
                            </p>
                        </div>
                    </div>
                    <div className="vf-detail-header__actions">
                        <Button variant="outline">Bearbeiten</Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="vf-detail-header__stats">
                    <div className="vf-detail-stat">
                        <div className="vf-detail-stat__value">{units.length}</div>
                        <div className="vf-detail-stat__label">Einheiten</div>
                    </div>
                    <div className="vf-detail-stat">
                        <div className="vf-detail-stat__value">-</div>
                        <div className="vf-detail-stat__label">Mieter</div>
                    </div>
                    <div className="vf-detail-stat">
                        <div className="vf-detail-stat__value">-</div>
                        <div className="vf-detail-stat__label">Verträge</div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Gebäudeinformationen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div>
                                <div className="text-sm text-gray-500">Adresse</div>
                                <div className="font-medium">{building.strasse} {building.hausnummer}</div>
                                <div className="font-medium">{building.plz} {building.ort}</div>
                            </div>
                            {building.land && (
                                <div>
                                    <div className="text-sm text-gray-500">Land</div>
                                    <div className="font-medium">{building.land}</div>
                                </div>
                            )}
                            {building.baujahr && (
                                <div>
                                    <div className="text-sm text-gray-500">Baujahr</div>
                                    <div className="font-medium">{building.baujahr}</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Wohneinheiten ({units.length})</CardTitle>
                            <Button variant="outline" size="sm">
                                <Home className="w-4 h-4" />
                                Hinzufügen
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {units.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Home className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>Noch keine Einheiten</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {units.map((unit) => (
                                    <div key={unit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Home className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <div className="font-medium">{unit.nummer}</div>
                                                {unit.flaeche && (
                                                    <div className="text-sm text-gray-500">{unit.flaeche} m²</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}