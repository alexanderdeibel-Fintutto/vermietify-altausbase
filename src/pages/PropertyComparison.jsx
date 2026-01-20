import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { VfSelect } from '@/components/shared/VfSelect';
import { Building2, Home, Euro, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PropertyComparison() {
    const [building1Id, setBuilding1Id] = useState('');
    const [building2Id, setBuilding2Id] = useState('');

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

    const getStats = (buildingId) => {
        const buildingUnits = units.filter(u => u.building_id === buildingId);
        const buildingContracts = contracts.filter(c => 
            buildingUnits.some(u => u.id === c.unit_id)
        );
        const totalRent = buildingContracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
        const occupancy = buildingUnits.length > 0 ? (buildingContracts.length / buildingUnits.length * 100) : 0;

        return {
            units: buildingUnits.length,
            contracts: buildingContracts.length,
            rent: totalRent,
            occupancy
        };
    };

    const building1 = buildings.find(b => b.id === building1Id);
    const building2 = buildings.find(b => b.id === building2Id);
    const stats1 = building1Id ? getStats(building1Id) : null;
    const stats2 = building2Id ? getStats(building2Id) : null;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Objektvergleich</h1>
                    <p className="vf-page-subtitle">Vergleichen Sie Ihre Immobilien</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <VfSelect
                            label="Objekt 1"
                            value={building1Id}
                            onChange={setBuilding1Id}
                            options={buildings.map(b => ({ value: b.id, label: b.name }))}
                            placeholder="Objekt auswählen..."
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <VfSelect
                            label="Objekt 2"
                            value={building2Id}
                            onChange={setBuilding2Id}
                            options={buildings.map(b => ({ value: b.id, label: b.name }))}
                            placeholder="Objekt auswählen..."
                        />
                    </CardContent>
                </Card>
            </div>

            {building1 && building2 && stats1 && stats2 && (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Building2 className="w-8 h-8 text-blue-600" />
                                <h2 className="text-xl font-bold">{building1.name}</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Home className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm text-gray-700">Einheiten</span>
                                    </div>
                                    <div className="text-2xl font-bold">{stats1.units}</div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Euro className="w-4 h-4 text-green-600" />
                                        <span className="text-sm text-gray-700">Monatliche Miete</span>
                                    </div>
                                    <div className="text-2xl font-bold text-green-700">{stats1.rent.toLocaleString('de-DE')}€</div>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <TrendingUp className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm text-gray-700">Auslastung</span>
                                    </div>
                                    <div className="text-2xl font-bold text-purple-700">{stats1.occupancy.toFixed(0)}%</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Building2 className="w-8 h-8 text-orange-600" />
                                <h2 className="text-xl font-bold">{building2.name}</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Home className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm text-gray-700">Einheiten</span>
                                    </div>
                                    <div className="text-2xl font-bold">{stats2.units}</div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Euro className="w-4 h-4 text-green-600" />
                                        <span className="text-sm text-gray-700">Monatliche Miete</span>
                                    </div>
                                    <div className="text-2xl font-bold text-green-700">{stats2.rent.toLocaleString('de-DE')}€</div>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <TrendingUp className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm text-gray-700">Auslastung</span>
                                    </div>
                                    <div className="text-2xl font-bold text-purple-700">{stats2.occupancy.toFixed(0)}%</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}