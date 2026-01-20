import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, BarChart3, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RentIndexTracking() {
    const { data: indices = [] } = useQuery({
        queryKey: ['rentIndices'],
        queryFn: () => base44.entities.RentIndex.list('-datum', 24)
    });

    const chartData = indices.slice(0, 12).reverse().map(index => ({
        monat: new Date(index.datum).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
        index: parseFloat(index.indexwert)
    }));

    const latestIndex = indices[0];
    const previousIndex = indices[1];
    const change = latestIndex && previousIndex 
        ? ((parseFloat(latestIndex.indexwert) - parseFloat(previousIndex.indexwert)) / parseFloat(previousIndex.indexwert) * 100) 
        : 0;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mietpreisindex</h1>
                    <p className="vf-page-subtitle">Verbraucherpreisindex für Indexmieten</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <BarChart3 className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{latestIndex?.indexwert || '-'}</div>
                        <div className="text-sm text-gray-600 mt-1">Aktueller Index</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Calendar className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">
                            {latestIndex ? new Date(latestIndex.datum).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' }) : '-'}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Letztes Update</div>
                    </CardContent>
                </Card>

                <Card className={`border-none ${change >= 0 ? 'bg-gradient-to-br from-green-600 to-green-800' : 'bg-gradient-to-br from-red-600 to-red-800'} text-white`}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{change >= 0 ? '+' : ''}{change.toFixed(2)}%</div>
                        <div className="text-sm opacity-90 mt-1">Veränderung</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Entwicklung (12 Monate)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monat" />
                            <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                            <Tooltip />
                            <Line type="monotone" dataKey="index" stroke="#1E3A8A" strokeWidth={3} name="Mietpreisindex" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Index-Historie</h3>
                    <div className="space-y-2">
                        {indices.slice(0, 12).map((index) => (
                            <div key={index.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="font-medium">
                                        {new Date(index.datum).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                                    </div>
                                    <div className="text-sm text-gray-600">{index.quelle || 'Statistisches Bundesamt'}</div>
                                </div>
                                <div className="text-xl font-bold text-blue-700">{index.indexwert}</div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}