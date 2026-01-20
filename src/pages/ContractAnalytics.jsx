import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ContractAnalytics() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const activeContracts = contracts.filter(c => new Date(c.mietende) > new Date());
    const expiringSoon = activeContracts.filter(c => {
        const days = (new Date(c.mietende) - new Date()) / (24*60*60*1000);
        return days <= 180;
    });

    const contractsByDuration = Array.from({ length: 5 }, (_, i) => {
        const minMonths = i * 12;
        const maxMonths = (i + 1) * 12;
        const count = contracts.filter(c => {
            const duration = (new Date(c.mietende) - new Date(c.mietbeginn)) / (30*24*60*60*1000);
            return duration >= minMonths && duration < maxMonths;
        }).length;
        return { dauer: `${i}-${i+1} Jahre`, count };
    });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Vertragsanalyse</h1>
                    <p className="vf-page-subtitle">Laufzeiten & Termine</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{contracts.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamt-Verträge</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-green-700">{activeContracts.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Aktive Verträge</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{expiringSoon.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Laufen bald aus</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{(activeContracts.length / contracts.length * 100).toFixed(0)}%</div>
                        <div className="text-sm opacity-90 mt-1">Aktiv-Quote</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Verträge nach Laufzeit</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={contractsByDuration}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="dauer" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3B82F6" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {expiringSoon.length > 0 && (
                <Card className="border-orange-300 bg-orange-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 text-orange-700">
                            Verträge laufen in 6 Monaten aus ({expiringSoon.length})
                        </h3>
                        <div className="space-y-2">
                            {expiringSoon.slice(0, 10).map(c => (
                                <div key={c.id} className="p-3 bg-white rounded-lg border border-orange-200">
                                    <div className="flex justify-between">
                                        <div>
                                            <div className="font-semibold text-sm">{c.einheit}</div>
                                            <div className="text-xs text-gray-600">Endet: {new Date(c.mietende).toLocaleDateString('de-DE')}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold">{c.kaltmiete.toLocaleString('de-DE')}€</div>
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