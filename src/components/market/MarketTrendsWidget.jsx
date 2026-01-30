import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function MarketTrendsWidget({ limit = 5 }) {
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTrends();
    }, []);

    async function loadTrends() {
        try {
            const data = await base44.entities.MarketTrend.list('-collected_at', limit);
            setTrends(data || []);
        } catch (error) {
            toast.error('Fehler beim Laden von Markttrends');
        } finally {
            setLoading(false);
        }
    }

    const categoryEmojis = {
        energy_prices: '⚡',
        real_estate: '🏠',
        technology: '💻',
        interest_rates: '📈',
        inflation: '💰',
        labor_costs: '👷'
    };

    const directionIcon = (direction) => {
        if (direction === 'up') return <TrendingUp className="w-4 h-4 text-red-500" />;
        if (direction === 'down') return <TrendingDown className="w-4 h-4 text-green-500" />;
        return <Activity className="w-4 h-4 text-gray-500" />;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Markttrends
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8 text-slate-500">Lädt...</div>
                ) : trends.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        Keine Markttrends verfügbar
                    </div>
                ) : (
                    <div className="space-y-4">
                        {trends.map(trend => (
                            <div
                                key={trend.id}
                                className="p-3 border rounded-lg bg-gradient-to-r from-slate-50 to-white hover:shadow-md transition"
                            >
                                {/* Header mit Kategorie und Richtung */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">
                                            {categoryEmojis[trend.trend_category]}
                                        </span>
                                        <div>
                                            <div className="font-semibold text-sm text-gray-900">
                                                {trend.trend_type}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {trend.region}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {directionIcon(trend.trend_direction)}
                                        <span className={`text-sm font-bold ${
                                            trend.trend_direction === 'up' ? 'text-red-600' :
                                            trend.trend_direction === 'down' ? 'text-green-600' :
                                            'text-gray-600'
                                        }`}>
                                            {trend.change_percent > 0 ? '+' : ''}{trend.change_percent}%
                                        </span>
                                    </div>
                                </div>

                                {/* Wert und Einheit */}
                                <div className="flex items-baseline gap-2 mb-3">
                                    <span className="text-2xl font-bold text-slate-900">
                                        {trend.current_value}
                                    </span>
                                    <span className="text-sm text-gray-600">{trend.unit}</span>
                                    {trend.previous_value && (
                                        <span className="text-xs text-gray-500">
                                            (vorher: {trend.previous_value})
                                        </span>
                                    )}
                                </div>

                                {/* Insights */}
                                {trend.insights && (
                                    <p className="text-xs text-gray-600 mb-3 italic">
                                        {trend.insights}
                                    </p>
                                )}

                                {/* Impact Areas */}
                                {trend.impact_areas && trend.impact_areas.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {trend.impact_areas.map(area => (
                                            <Badge key={area} variant="outline" className="text-xs">
                                                {area}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Quelle mit Link */}
                                <div className="flex items-center justify-between pt-3 border-t">
                                    <div className="text-xs text-gray-500">
                                        <span className="font-medium">Quelle:</span> {trend.source_name}
                                    </div>
                                    {trend.source_url && (
                                        <a
                                            href={trend.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            Link <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}