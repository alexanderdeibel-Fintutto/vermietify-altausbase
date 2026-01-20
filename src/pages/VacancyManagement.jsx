import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Calendar, Users, TrendingDown, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function VacancyManagement() {
    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const occupiedUnits = contracts.map(c => c.unit_id);
    const vacantUnits = units.filter(u => !occupiedUnits.includes(u.id));
    const occupancyRate = (occupiedUnits.length / (units.length || 1)) * 100;

    const upcomingVacancies = contracts
        .filter(c => c.mietende && new Date(c.mietende) > new Date() && new Date(c.mietende) < new Date(Date.now() + 90*24*60*60*1000))
        .sort((a, b) => new Date(a.mietende) - new Date(b.mietende));

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Leerstandsverwaltung</h1>
                    <p className="vf-page-subtitle">{vacantUnits.length} leere Einheiten</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Home className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{units.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Einheiten gesamt</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{occupiedUnits.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Vermietet</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{vacantUnits.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Leerstand</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingDown className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{occupancyRate.toFixed(0)}%</div>
                        <div className="text-sm opacity-90 mt-1">Auslastungsquote</div>
                    </CardContent>
                </Card>
            </div>

            {vacantUnits.length > 0 && (
                <Card className="border-orange-300 bg-orange-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-700" />
                            Leerstehende Einheiten ({vacantUnits.length})
                        </h3>
                        <div className="space-y-2">
                            {vacantUnits.map((unit) => {
                                const building = buildings.find(b => b.id === unit.building_id);
                                return (
                                    <div key={unit.id} className="p-3 bg-white rounded-lg border border-orange-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold">{unit.nummer}</div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {building?.name || 'Unbekannt'} • {unit.flaeche}m²
                                                </div>
                                            </div>
                                            <Button size="sm" className="vf-btn-primary">Bewerben</Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {upcomingVacancies.length > 0 && (
                <Card className="border-blue-300 bg-blue-50/50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Bevorstehende Kündigungen ({upcomingVacancies.length})</h3>
                        <div className="space-y-2">
                            {upcomingVacancies.slice(0, 5).map((contract) => (
                                <div key={contract.id} className="p-3 bg-white rounded-lg border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold">Einheit {contract.unit_id}</div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                Endet: {new Date(contract.mietende).toLocaleDateString('de-DE')}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500">
                                                in {Math.ceil((new Date(contract.mietende) - new Date()) / (24*60*60*1000))} Tagen
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}