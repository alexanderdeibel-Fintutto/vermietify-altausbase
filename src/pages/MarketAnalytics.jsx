import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, MapPin, BarChart3, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function MarketAnalytics() {
    const regionalData = [
        { region: 'Mitte', durchschnitt: 12.5, ihre: 11.8 },
        { region: 'Nord', durchschnitt: 10.2, ihre: 10.5 },
        { region: 'Süd', durchschnitt: 11.8, ihre: 11.2 },
        { region: 'Ost', durchschnitt: 9.5, ihre: 9.8 },
        { region: 'West', durchschnitt: 13.2, ihre: 12.9 }
    ];

    const trendData = Array.from({ length: 12 }, (_, i) => ({
        monat: new Date(2025, i).toLocaleDateString('de-DE', { month: 'short' }),
        markt: 11.5 + (i * 0.3) + (Math.random() * 0.5 - 0.25),
        ihre: 11.0 + (i * 0.25) + (Math.random() * 0.4 - 0.2)
    }));

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Marktanalyse</h1>
                    <p className="vf-page-subtitle">Regionale Mietpreisentwicklung</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <MapPin className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">11,30€</div>
                        <div className="text-sm text-gray-600 mt-1">Ø Marktmiete/m²</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Target className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">10,90€</div>
                        <div className="text-sm text-gray-600 mt-1">Ihre Ø Miete/m²</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <BarChart3 className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">+3,2%</div>
                        <div className="text-sm text-gray-600 mt-1">Marktentwicklung</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">96%</div>
                        <div className="text-sm opacity-90 mt-1">Marktposition</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Regionaler Mietvergleich (€/m²)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={regionalData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="region" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="durchschnitt" fill="#94A3B8" name="Marktdurchschnitt" />
                            <Bar dataKey="ihre" fill="#1E3A8A" name="Ihre Mieten" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Mietpreisentwicklung 2025</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monat" />
                            <YAxis domain={[9, 14]} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="markt" stroke="#94A3B8" strokeWidth={2} name="Marktdurchschnitt" strokeDasharray="5 5" />
                            <Line type="monotone" dataKey="ihre" stroke="#1E3A8A" strokeWidth={3} name="Ihre Mieten" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}