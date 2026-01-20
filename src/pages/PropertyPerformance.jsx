import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PropertyPerformance() {
    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const buildingsWithMetrics = buildings.map(building => {
        const buildingContracts = contracts.filter(c => c.building_id === building.id);
        const income = buildingContracts.reduce((sum, c) => sum + parseFloat(c.kaltmiete || 0), 0) * 12;
        const expenses = invoices.filter(i => i.building_id === building.id).reduce((sum, i) => sum + parseFloat(i.betrag || 0), 0);
        const roi = building.kaufpreis > 0 ? ((income - expenses) / building.kaufpreis * 100) : 0;
        return { ...building, income, expenses, roi, name: building.name };
    });

    const bestPerformer = buildingsWithMetrics.sort((a, b) => b.roi - a.roi)[0];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Immobilien-Performance</h1>
                    <p className="vf-page-subtitle">Rendite & Vergleich</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{buildings.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Immobilien</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-green-700">
                            {(buildingsWithMetrics.reduce((sum, b) => sum + b.roi, 0) / buildings.length).toFixed(2)}%
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Ø ROI</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Award className="w-8 h-8 text-yellow-600" />
                        </div>
                        <div className="text-lg font-bold">{bestPerformer?.name}</div>
                        <div className="text-sm text-gray-600 mt-1">Best Performer</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{bestPerformer?.roi.toFixed(2)}%</div>
                        <div className="text-sm opacity-90 mt-1">Höchste ROI</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Performance-Vergleich</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={buildingsWithMetrics}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(v) => `${typeof v === 'number' ? v.toFixed(2) : v}%`} />
                            <Legend />
                            <Bar dataKey="roi" fill="#3B82F6" name="ROI %" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}