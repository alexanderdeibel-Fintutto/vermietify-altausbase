import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, ArrowLeft, Users, FileText, Euro } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UnitDetail() {
    const params = new URLSearchParams(window.location.search);
    const unitId = params.get('id');

    const { data: unit, isLoading } = useQuery({
        queryKey: ['unit', unitId],
        queryFn: async () => {
            const units = await base44.entities.Unit.filter({ id: unitId });
            return units[0];
        },
        enabled: !!unitId
    });

    const { data: building } = useQuery({
        queryKey: ['building', unit?.building_id],
        queryFn: async () => {
            const buildings = await base44.entities.Building.filter({ id: unit.building_id });
            return buildings[0];
        },
        enabled: !!unit?.building_id
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts', unitId],
        queryFn: () => base44.entities.LeaseContract.filter({ unit_id: unitId }),
        enabled: !!unitId
    });

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    if (!unit) {
        return <div className="text-center py-20">Einheit nicht gefunden</div>;
    }

    const activeContract = contracts.find(c => !c.mietende || new Date(c.mietende) > new Date());

    return (
        <div className="space-y-6">
            <Link to={createPageUrl('UnitsManagement')} className="vf-page-back">
                <ArrowLeft className="w-4 h-4" />
                Zurück zu Einheiten
            </Link>

            {/* Header */}
            <div className="vf-detail-header">
                <div className="vf-detail-header__top">
                    <div className="flex items-center gap-4">
                        <div className="vf-detail-header__icon">
                            <Home className="w-7 h-7" />
                        </div>
                        <div className="vf-detail-header__info">
                            <h1 className="vf-detail-header__title">{unit.nummer}</h1>
                            {building && (
                                <p className="vf-detail-header__subtitle">{building.name}</p>
                            )}
                        </div>
                    </div>
                    <div className="vf-detail-header__actions">
                        <Button variant="outline">Bearbeiten</Button>
                    </div>
                </div>

                <div className="vf-detail-header__stats">
                    <div className="vf-detail-stat">
                        <div className="vf-detail-stat__value">{unit.flaeche || '-'}</div>
                        <div className="vf-detail-stat__label">m²</div>
                    </div>
                    <div className="vf-detail-stat">
                        <div className="vf-detail-stat__value">{unit.zimmer || '-'}</div>
                        <div className="vf-detail-stat__label">Zimmer</div>
                    </div>
                    <div className="vf-detail-stat">
                        <div className="vf-detail-stat__value">{contracts.length}</div>
                        <div className="vf-detail-stat__label">Verträge</div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Einheitsinformationen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div>
                                <div className="text-sm text-gray-500">Wohnungsnummer</div>
                                <div className="font-medium">{unit.nummer}</div>
                            </div>
                            {unit.flaeche && (
                                <div>
                                    <div className="text-sm text-gray-500">Wohnfläche</div>
                                    <div className="font-medium">{unit.flaeche} m²</div>
                                </div>
                            )}
                            {unit.zimmer && (
                                <div>
                                    <div className="text-sm text-gray-500">Anzahl Zimmer</div>
                                    <div className="font-medium">{unit.zimmer}</div>
                                </div>
                            )}
                            {unit.stock && (
                                <div>
                                    <div className="text-sm text-gray-500">Stockwerk</div>
                                    <div className="font-medium">{unit.stock}</div>
                                </div>
                            )}
                            <div>
                                <div className="text-sm text-gray-500">Status</div>
                                <Badge className={activeContract ? 'vf-badge-success' : 'vf-badge-warning'}>
                                    {activeContract ? 'Vermietet' : 'Leer'}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Aktueller Vertrag</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activeContract ? (
                            <Link to={createPageUrl('ContractDetail') + `?id=${activeContract.id}`}>
                                <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="font-semibold mb-2">Vertrag #{activeContract.id?.slice(0, 8)}</div>
                                    <div className="text-sm text-gray-600 mb-1">
                                        ab {new Date(activeContract.mietbeginn).toLocaleDateString('de-DE')}
                                    </div>
                                    {activeContract.kaltmiete && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <Euro className="w-4 h-4 text-green-600" />
                                            <span className="font-semibold text-green-700">{activeContract.kaltmiete}€ / Monat</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>Derzeit nicht vermietet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* All Contracts History */}
            <Card>
                <CardHeader>
                    <CardTitle>Vertragsverlauf</CardTitle>
                </CardHeader>
                <CardContent>
                    {contracts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Noch keine Verträge</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {contracts.map((contract) => (
                                <Link key={contract.id} to={createPageUrl('ContractDetail') + `?id=${contract.id}`}>
                                    <div className="p-3 border rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">Vertrag #{contract.id?.slice(0, 8)}</div>
                                                <div className="text-sm text-gray-600">
                                                    {new Date(contract.mietbeginn).toLocaleDateString('de-DE')}
                                                    {contract.mietende && ` - ${new Date(contract.mietende).toLocaleDateString('de-DE')}`}
                                                </div>
                                            </div>
                                            <div className="font-semibold">{contract.kaltmiete}€</div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}