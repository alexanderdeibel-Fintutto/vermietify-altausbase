import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Droplet, TrendingUp, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function EnergyManagement() {
    const { data: meterReadings = [] } = useQuery({
        queryKey: ['meterReadings'],
        queryFn: () => base44.entities.MeterReading.list('-ablesedatum')
    });

    const { data: meters = [] } = useQuery({
        queryKey: ['meters'],
        queryFn: () => base44.entities.Meter.list()
    });

    const electricityMeters = meters.filter(m => m.typ === 'Strom');
    const waterMeters = meters.filter(m => m.typ === 'Wasser');

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        monat: new Date(2025, i).toLocaleDateString('de-DE', { month: 'short' }),
        strom: 300 + Math.random() * 100,
        wasser: 50 + Math.random() * 20
    }));

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Energieverwaltung</h1>
                    <p className="vf-page-subtitle">Zähler & Verbrauch</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Zap className="w-8 h-8 text-yellow-600" />
                        </div>
                        <div className="text-3xl font-bold">{electricityMeters.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Stromzähler</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Droplet className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{waterMeters.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Wasserzähler</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold">{meterReadings.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Ablesungen</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{meters.length}</div>
                        <div className="text-sm opacity-90 mt-1">Zähler gesamt</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Verbrauchsentwicklung 2025</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monat" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="strom" stroke="#F59E0B" strokeWidth={2} name="Strom (kWh)" />
                            <Line type="monotone" dataKey="wasser" stroke="#0EA5E9" strokeWidth={2} name="Wasser (m³)" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Aktuelle Zähler</h3>
                    <div className="space-y-2">
                        {meters.slice(0, 10).map((meter) => (
                            <div key={meter.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {meter.typ === 'Strom' ? (
                                        <Zap className="w-5 h-5 text-yellow-600" />
                                    ) : (
                                        <Droplet className="w-5 h-5 text-blue-600" />
                                    )}
                                    <div>
                                        <div className="font-semibold text-sm">{meter.zaehlernummer}</div>
                                        <div className="text-xs text-gray-600">{meter.typ}</div>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline">Ablesen</Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}