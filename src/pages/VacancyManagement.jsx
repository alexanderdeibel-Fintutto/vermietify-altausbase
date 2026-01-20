import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Home, AlertCircle, Calendar } from 'lucide-react';
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

    const occupiedUnitIds = contracts
        .filter(c => !c.vertragsende || new Date(c.vertragsende) > new Date())
        .map(c => c.unit_id);

    const vacantUnits = units.filter(u => !occupiedUnitIds.includes(u.id));
    const occupancyRate = units.length > 0 ? ((units.length - vacantUnits.length) / units.length * 100) : 0;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Leerstandsverwaltung</h1>
                    <p className="vf-page-subtitle">{vacantUnits.length} leerstehende Einheiten</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{units.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamt Einheiten</div>
                    </CardContent>
                </Card>

                <Card className="border-red-300 bg-red-50">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-red-700">{vacantUnits.length}</div>
                        <div className="text-sm text-gray-700 mt-1">Leerstehend</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{occupancyRate.toFixed(1)}%</div>
                        <div className="text-sm opacity-90 mt-1">Auslastung</div>
                    </CardContent>
                </Card>
            </div>

            {vacantUnits.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Home className="w-20 h-20 mx-auto mb-4 text-green-300" />
                        <h3 className="text-xl font-semibold mb-2 text-green-700">Vollständig vermietet!</h3>
                        <p className="text-gray-600">Alle Einheiten sind aktuell vermietet</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {vacantUnits.map((unit) => {
                        const building = buildings.find(b => b.id === unit.building_id);
                        return (
                            <Card key={unit.id} className="border-orange-300 bg-orange-50/50">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white">
                                                <AlertCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold mb-1">Einheit {unit.nummer}</h3>
                                                <div className="text-sm text-gray-700 mb-2">
                                                    {building?.name || 'Unbekanntes Gebäude'}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                                    <span>{unit.flaeche} m²</span>
                                                    <span>•</span>
                                                    <span>{unit.zimmer} Zimmer</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className="vf-badge-warning">Leer</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}