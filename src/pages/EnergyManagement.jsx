import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Droplet, Flame, Leaf } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function EnergyManagement() {
    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const energyData = [
        { month: 'Jan', strom: 450, wasser: 120, heizung: 850 },
        { month: 'Feb', strom: 420, wasser: 115, heizung: 800 },
        { month: 'Mar', strom: 440, wasser: 125, heizung: 650 },
        { month: 'Apr', strom: 410, wasser: 118, heizung: 400 },
        { month: 'Mai', strom: 380, wasser: 130, heizung: 200 },
        { month: 'Jun', strom: 400, wasser: 135, heizung: 100 }
    ];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Energiemanagement</h1>
                    <p className="vf-page-subtitle">Verbrauchsübersicht & Optimierung</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Zap className="w-8 h-8 text-yellow-600" />
                        </div>
                        <div className="text-3xl font-bold">2.500</div>
                        <div className="text-sm text-gray-600 mt-1">kWh Strom</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Droplet className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">743</div>
                        <div className="text-sm text-gray-600 mt-1">m³ Wasser</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Flame className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold">3.000</div>
                        <div className="text-sm text-gray-600 mt-1">kWh Heizung</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-600 to-green-800 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Leaf className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">-12%</div>
                        <div className="text-sm opacity-90 mt-1">vs. Vorjahr</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Verbrauchsentwicklung</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={energyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="strom" stroke="#EAB308" strokeWidth={2} name="Strom (kWh)" />
                            <Line type="monotone" dataKey="wasser" stroke="#3B82F6" strokeWidth={2} name="Wasser (m³)" />
                            <Line type="monotone" dataKey="heizung" stroke="#EF4444" strokeWidth={2} name="Heizung (kWh)" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}