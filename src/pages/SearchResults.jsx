import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { Search, Building2, Users, FileText, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SearchResults() {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q') || '';
    const [searchQuery, setSearchQuery] = useState(initialQuery);

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const searchLower = searchQuery.toLowerCase();

    const filteredBuildings = buildings.filter(b =>
        b.name?.toLowerCase().includes(searchLower) ||
        b.strasse?.toLowerCase().includes(searchLower) ||
        b.ort?.toLowerCase().includes(searchLower)
    );

    const filteredTenants = tenants.filter(t =>
        t.vorname?.toLowerCase().includes(searchLower) ||
        t.nachname?.toLowerCase().includes(searchLower) ||
        t.email?.toLowerCase().includes(searchLower)
    );

    const filteredUnits = units.filter(u =>
        u.nummer?.toLowerCase().includes(searchLower)
    );

    const totalResults = filteredBuildings.length + filteredTenants.length + filteredUnits.length;

    return (
        <div className="max-w-4xl space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Suchergebnisse</h1>
                    <p className="vf-page-subtitle">{totalResults} Ergebnisse gefunden</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-4">
                    <VfInput
                        leftIcon={Search}
                        placeholder="Suchen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </CardContent>
            </Card>

            {totalResults === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Search className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-600">Keine Ergebnisse gefunden</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {filteredBuildings.length > 0 && (
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <Building2 className="w-5 h-5" />
                                    Gebäude ({filteredBuildings.length})
                                </h3>
                                <div className="space-y-2">
                                    {filteredBuildings.map(building => (
                                        <Link key={building.id} to={createPageUrl('BuildingDetail') + `?id=${building.id}`}>
                                            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="font-semibold">{building.name}</div>
                                                <div className="text-sm text-gray-600">{building.strasse}, {building.ort}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {filteredTenants.length > 0 && (
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Mieter ({filteredTenants.length})
                                </h3>
                                <div className="space-y-2">
                                    {filteredTenants.map(tenant => (
                                        <Link key={tenant.id} to={createPageUrl('TenantDetail') + `?id=${tenant.id}`}>
                                            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="font-semibold">{tenant.vorname} {tenant.nachname}</div>
                                                <div className="text-sm text-gray-600">{tenant.email}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {filteredUnits.length > 0 && (
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <Home className="w-5 h-5" />
                                    Einheiten ({filteredUnits.length})
                                </h3>
                                <div className="space-y-2">
                                    {filteredUnits.map(unit => (
                                        <Link key={unit.id} to={createPageUrl('UnitDetail') + `?id=${unit.id}`}>
                                            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="font-semibold">{unit.nummer}</div>
                                                <div className="text-sm text-gray-600">{unit.flaeche} m² • {unit.zimmer} Zimmer</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}