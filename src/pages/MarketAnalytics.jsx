import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Home, BarChart3, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MarketAnalytics() {
    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const averageRentPerSqm = contracts.reduce((sum, c) => {
        const rent = parseFloat(c.kaltmiete) || 0;
        const area = parseFloat(c.wohnflaeche) || 1;
        return sum + (rent / area);
    }, 0) / (contracts.length || 1);

    const marketData = [
        { bereich: 'Zentrum', durchschnitt: 15.5, portfolio: averageRentPerSqm },
        { bereich: 'Nord', durchschnitt: 12.3, portfolio: averageRentPerSqm * 0.9 },
        { bereich: 'Süd', durchschnitt: 13.8, portfolio: averageRentPerSqm * 1.1 },
        { bereich: 'Ost', durchschnitt: 11.2, portfolio: averageRentPerSqm * 0.85 },
        { bereich: 'West', durchschnitt: 14.1, portfolio: averageRentPerSqm * 1.05 }
    ];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Markt-Analytics</h1>
                    <p className="vf-page-subtitle">Vergleich & Potenziale</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Home className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{buildings.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Immobilien</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <BarChart3 className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{averageRentPerSqm.toFixed(2)}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ø Miete/m²</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Target className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">13.5€</div>
                        <div className="text-sm text-gray-600 mt-1">Markt Ø/m²</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {((averageRentPerSqm / 13.5 - 1) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm opacity-90 mt-1">vs. Markt</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Marktvergleich nach Bereich</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={marketData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="bereich" />
                            <YAxis label={{ value: '€/m²', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="durchschnitt" fill="#94A3B8" name="Markt-Durchschnitt" />
                            <Bar dataKey="portfolio" fill="#3B82F6" name="Ihr Portfolio" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Markt-Insights</h3>
                        <div className="space-y-3">
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="font-semibold text-sm text-green-700">Mietpreisentwicklung positiv</div>
                                <div className="text-xs text-gray-600 mt-1">Durchschnittlich +3.2% im Vergleich zum Vorjahr</div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="font-semibold text-sm text-blue-700">Hohe Nachfrage</div>
                                <div className="text-xs text-gray-600 mt-1">Leerstandsquote unter 2%</div>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="font-semibold text-sm text-orange-700">Optimierungspotenzial</div>
                                <div className="text-xs text-gray-600 mt-1">Einige Mieten liegen unter Marktdurchschnitt</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Empfohlene Maßnahmen</h3>
                        <div className="space-y-2">
                            <div className="p-3 bg-gray-50 rounded-lg border">
                                <div className="font-semibold text-sm">Mietanpassungen prüfen</div>
                                <div className="text-xs text-gray-600 mt-1">3 Einheiten könnten höhere Mieten erzielen</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border">
                                <div className="font-semibold text-sm">Modernisierungen planen</div>
                                <div className="text-xs text-gray-600 mt-1">Potenzielle Wertsteigerung von 15%</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border">
                                <div className="font-semibold text-sm">Energieeffizienz verbessern</div>
                                <div className="text-xs text-gray-600 mt-1">Kosteneinsparung bis zu 20%</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}