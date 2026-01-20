import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Droplet, Flame, FileText, Plus } from 'lucide-react';

export default function UtilityBilling() {
    const { data: meterReadings = [] } = useQuery({
        queryKey: ['meterReadings'],
        queryFn: () => base44.entities.MeterReading.list('-ablesedatum', 50)
    });

    const { data: statements = [] } = useQuery({
        queryKey: ['operatingCostStatements'],
        queryFn: () => base44.entities.OperatingCostStatement.list()
    });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Nebenkostenabrechnung</h1>
                    <p className="vf-page-subtitle">Verbrauch & Abrechnungen</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Plus className="w-4 h-4" />
                        Neue Abrechnung
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Zap className="w-8 h-8 text-yellow-600" />
                        </div>
                        <div className="text-3xl font-bold">{Math.floor(Math.random() * 50 + 100)}</div>
                        <div className="text-sm text-gray-600 mt-1">Strom (kWh)</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Droplet className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{Math.floor(Math.random() * 30 + 50)}</div>
                        <div className="text-sm text-gray-600 mt-1">Wasser (m³)</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Flame className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold">{Math.floor(Math.random() * 200 + 400)}</div>
                        <div className="text-sm text-gray-600 mt-1">Heizung (kWh)</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{statements.length}</div>
                        <div className="text-sm opacity-90 mt-1">Abrechnungen</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Letzte Zählerstände</h3>
                    <div className="space-y-3">
                        {meterReadings.slice(0, 10).map((reading) => (
                            <div key={reading.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    {reading.zaehlertyp === 'Strom' && <Zap className="w-5 h-5 text-yellow-600" />}
                                    {reading.zaehlertyp === 'Wasser' && <Droplet className="w-5 h-5 text-blue-600" />}
                                    {reading.zaehlertyp === 'Heizung' && <Flame className="w-5 h-5 text-red-600" />}
                                    <div>
                                        <div className="font-medium">{reading.zaehlertyp || 'Unbekannt'}</div>
                                        <div className="text-sm text-gray-600">
                                            {new Date(reading.ablesedatum).toLocaleDateString('de-DE')}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">{reading.zaehlerstand}</div>
                                    <div className="text-sm text-gray-600">Zählerstand</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}