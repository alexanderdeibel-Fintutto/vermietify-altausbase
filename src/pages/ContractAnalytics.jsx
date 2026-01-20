import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, Clock, TrendingUp, AlertCircle } from 'lucide-react';

export default function ContractAnalytics() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const activeContracts = contracts.filter(c => !c.mietende || new Date(c.mietende) > new Date());
    const expiringIn90Days = contracts.filter(c => {
        if (!c.mietende) return false;
        const daysUntil = (new Date(c.mietende) - new Date()) / (24*60*60*1000);
        return daysUntil > 0 && daysUntil <= 90;
    });

    const avgContractDuration = contracts.reduce((sum, c) => {
        if (!c.mietbeginn || !c.mietende) return sum;
        const duration = (new Date(c.mietende) - new Date(c.mietbeginn)) / (365*24*60*60*1000);
        return sum + duration;
    }, 0) / (contracts.filter(c => c.mietende).length || 1);

    const contractsByYear = {};
    contracts.forEach(c => {
        const year = new Date(c.mietbeginn).getFullYear();
        contractsByYear[year] = (contractsByYear[year] || 0) + 1;
    });

    const yearlyData = Object.entries(contractsByYear)
        .map(([year, count]) => ({ jahr: year, vertraege: count }))
        .sort((a, b) => a.jahr - b.jahr);

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Vertragsanalyse</h1>
                    <p className="vf-page-subtitle">{contracts.length} Mietverträge</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{contracts.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Verträge gesamt</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{activeContracts.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Aktive Verträge</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{expiringIn90Days.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Enden in 90 Tagen</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{avgContractDuration.toFixed(1)}</div>
                        <div className="text-sm opacity-90 mt-1">Ø Jahre Laufzeit</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Vertragsentwicklung nach Jahr</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={yearlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="jahr" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="vertraege" fill="#1E3A8A" name="Neue Verträge" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Monatliche Mieteinnahmen {selectedYear}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monat" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="einnahmen" stroke="#10B981" strokeWidth={2} name="Soll-Einnahmen" />
                            <Line type="monotone" dataKey="ausgaben" stroke="#EF4444" strokeWidth={2} name="Ausgaben" />
                            <Line type="monotone" dataKey="netto" stroke="#1E3A8A" strokeWidth={3} name="Netto" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}