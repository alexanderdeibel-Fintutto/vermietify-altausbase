import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gauge, Plus, Upload, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MeterReadings() {
    const { data: readings = [] } = useQuery({
        queryKey: ['meterReadings'],
        queryFn: () => base44.entities.MeterReading.list('-ablesedatum')
    });

    const { data: meters = [] } = useQuery({
        queryKey: ['meters'],
        queryFn: () => base44.entities.Meter.list()
    });

    const recentReadings = readings.slice(0, 20);
    const overallConsumption = readings.reduce((sum, r) => sum + (parseFloat(r.zaehlerstand) || 0), 0);

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Zählerablesungen</h1>
                    <p className="vf-page-subtitle">{readings.length} Ablesungen erfasst</p>
                </div>
                <div className="vf-page-actions">
                    <Button variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Importieren
                    </Button>
                    <Button className="vf-btn-gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        Neue Ablesung
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Gauge className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{readings.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Ablesungen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Gauge className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold">{meters.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Zähler</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">{overallConsumption.toFixed(0)}</div>
                        <div className="text-sm text-gray-600 mt-1">Ø Verbrauch</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {readings.length > 0 
                                ? new Date(readings[0].ablesedatum).toLocaleDateString('de-DE') 
                                : '-'}
                        </div>
                        <div className="text-sm opacity-90 mt-1">Letzte Ablesung</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Aktuelle Ablesungen</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {recentReadings.map((reading) => {
                            const meter = meters.find(m => m.id === reading.meter_id);
                            return (
                                <div key={reading.id} className="p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-sm">{meter?.zaehlernummer || 'Unbekannt'}</div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                {new Date(reading.ablesedatum).toLocaleDateString('de-DE')}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold">{reading.zaehlerstand}</div>
                                            <div className="text-xs text-gray-600">{meter?.einheit || 'Einheit'}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}