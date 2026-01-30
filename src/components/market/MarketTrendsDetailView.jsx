import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, ExternalLink, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function MarketTrendsDetailView({ building_id }) {
    const [trends, setTrends] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatingRecs, setGeneratingRecs] = useState(false);

    useEffect(() => {
        loadTrends();
    }, []);

    async function loadTrends() {
        try {
            const data = await base44.entities.MarketTrend.list('-collected_at');
            setTrends(data || []);
        } catch (error) {
            toast.error('Fehler beim Laden von Markttrends');
        } finally {
            setLoading(false);
        }
    }

    async function generateRecommendations() {
        setGeneratingRecs(true);
        try {
            const { data } = await base44.functions.invoke('generateAIRecommendationsWithMarketData', {
                building_id
            });
            setRecommendations(data.recommendations || []);
            toast.success(`${data.recommendations?.length || 0} Empfehlungen generiert`);
        } catch (error) {
            toast.error('Fehler beim Generieren von Empfehlungen');
        } finally {
            setGeneratingRecs(false);
        }
    }

    const categoryColors = {
        energy_prices: 'bg-orange-100 text-orange-800',
        real_estate: 'bg-blue-100 text-blue-800',
        technology: 'bg-purple-100 text-purple-800',
        interest_rates: 'bg-green-100 text-green-800',
        inflation: 'bg-red-100 text-red-800',
        labor_costs: 'bg-yellow-100 text-yellow-800'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Marktdaten & AI-Empfehlungen</h2>
                <Button
                    onClick={generateRecommendations}
                    disabled={generatingRecs || trends.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    <Zap className="w-4 h-4 mr-2" />
                    {generatingRecs ? 'Analysiere...' : 'Empfehlungen generieren'}
                </Button>
            </div>

            {/* Markttrends Übersicht */}
            <Card>
                <CardHeader>
                    <CardTitle>Aktuelle Markttrends</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Lädt...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {trends.map(trend => (
                                <div key={trend.id} className="p-4 border rounded-lg">
                                    {/* Kategorie Badge */}
                                    <Badge className={categoryColors[trend.trend_category]}>
                                        {trend.trend_category}
                                    </Badge>

                                    {/* Trend-Typ */}
                                    <h3 className="font-semibold mt-3 text-gray-900">
                                        {trend.trend_type}
                                    </h3>

                                    {/* Wert mit Änderung */}
                                    <div className="flex items-end gap-3 mt-3">
                                        <span className="text-3xl font-bold">
                                            {trend.current_value}
                                        </span>
                                        <span className="text-gray-600">{trend.unit}</span>
                                        <div className="flex items-center gap-1">
                                            {trend.trend_direction === 'up' ? (
                                                <TrendingUp className="w-4 h-4 text-red-500" />
                                            ) : (
                                                <TrendingDown className="w-4 h-4 text-green-500" />
                                            )}
                                            <span className={trend.trend_direction === 'up' ? 'text-red-600' : 'text-green-600'}>
                                                {trend.change_percent > 0 ? '+' : ''}{trend.change_percent}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Insights */}
                                    <p className="text-sm text-gray-600 mt-3">
                                        {trend.insights}
                                    </p>

                                    {/* Auswirkungen */}
                                    {trend.impact_areas && (
                                        <div className="mt-3 space-y-2">
                                            <div className="text-xs font-semibold text-gray-600">
                                                Auswirkungen:
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {trend.impact_areas.map(area => (
                                                    <Badge key={area} variant="outline" className="text-xs">
                                                        {area}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quelle */}
                                    <div className="mt-4 pt-3 border-t text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">
                                                <strong>Quelle:</strong> {trend.source_name}
                                            </span>
                                            {trend.source_url && (
                                                <a
                                                    href={trend.source_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                >
                                                    Link <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                        <div className="text-gray-500 mt-1">
                                            Erhoben: {new Date(trend.collected_at).toLocaleDateString('de-DE')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Empfehlungen basierend auf Marktdaten */}
            {recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>AI-Empfehlungen basierend auf Marktdaten</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recommendations.map((rec, idx) => (
                                <div key={idx} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                                    <p className="text-sm text-gray-600 mt-2">{rec.description}</p>
                                    <div className="flex gap-4 mt-3 text-sm">
                                        {rec.potential_savings_eur > 0 && (
                                            <Badge className="bg-green-100 text-green-800">
                                                Sparpotenzial: {rec.potential_savings_eur}€
                                            </Badge>
                                        )}
                                        <Badge variant="outline">
                                            Aufwand: {rec.implementation_effort}
                                        </Badge>
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