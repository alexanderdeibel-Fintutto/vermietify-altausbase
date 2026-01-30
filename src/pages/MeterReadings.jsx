import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gauge, Calendar, TrendingUp, Plus, FileText } from 'lucide-react';
import AIMeterOCR from '../components/meters/AIMeterOCR';
import InvoiceOCRDialog from '../components/meters/InvoiceOCRDialog';
import MeterReplacementAlertsWidget from '../components/meters/MeterReplacementAlertsWidget';
import ProactiveRecommendationsWidget from '../components/ai/ProactiveRecommendationsWidget';

export default function MeterReadings() {
    const [showInvoiceOCR, setShowInvoiceOCR] = useState(false);

    const { data: readings = [], refetch: refetchReadings } = useQuery({
        queryKey: ['meterReadings'],
        queryFn: () => base44.entities.MeterReading.list('-created_date')
    });

    const { data: meters = [], refetch: refetchMeters } = useQuery({
        queryKey: ['meters'],
        queryFn: () => base44.entities.Meter.list()
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Zählerablesung</h1>
                    <p className="vf-page-subtitle">{readings.length} Ablesungen erfasst</p>
                </div>
                <div className="flex gap-2">
                    <AIMeterOCR building_id={buildings[0]?.id} onMeterCreated={refetchMeters} />
                    <Button onClick={() => setShowInvoiceOCR(true)} variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Rechnung scannen
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
                        <div className="text-3xl font-bold">{meters.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Zähler</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{readings.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Ablesungen</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-green-700">
                            {readings.filter(r => new Date(r.created_date) > new Date(Date.now() - 30*24*60*60*1000)).length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Letzte 30 Tage</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {meters.filter(m => m.type === 'electricity' || m.typ === 'Strom').length}
                        </div>
                        <div className="text-sm opacity-90 mt-1">Stromzähler</div>
                    </CardContent>
                </Card>
            </div>

            {/* AI Widgets */}
            <div className="grid md:grid-cols-2 gap-4">
                <MeterReplacementAlertsWidget />
                <ProactiveRecommendationsWidget limit={5} />
            </div>

            <InvoiceOCRDialog 
                building_id={buildings[0]?.id}
                open={showInvoiceOCR}
                onOpenChange={setShowInvoiceOCR}
                onSuccess={refetchMeters}
            />

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Letzte Ablesungen</h3>
                    <div className="space-y-2">
                        {readings.slice(0, 10).map(reading => (
                            <div key={reading.id} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold">Zähler {reading.meter_id?.slice(-6)}</div>
                                        <div className="text-sm text-gray-600">{new Date(reading.created_date).toLocaleDateString('de-DE')}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{reading.value} {reading.unit || 'kWh'}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}