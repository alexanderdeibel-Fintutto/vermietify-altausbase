import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, DollarSign, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ProactiveRecommendationsWidget({ limit = 5 }) {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecommendations();

        // Realtime updates
        const unsubscribe = base44.entities.AIProactiveRecommendation.subscribe((event) => {
            if (event.type === 'create') {
                setRecommendations(prev => [event.data, ...prev].slice(0, limit));
            } else if (event.type === 'update') {
                setRecommendations(prev => prev.map(r => r.id === event.id ? event.data : r));
            } else if (event.type === 'delete') {
                setRecommendations(prev => prev.filter(r => r.id !== event.id));
            }
        });

        return unsubscribe;
    }, [limit]);

    async function loadRecommendations() {
        setLoading(true);
        try {
            const data = await base44.entities.AIProactiveRecommendation.filter({
                status: { $in: ['new', 'viewed'] }
            }, '-priority_score', limit);
            setRecommendations(data);
        } catch (error) {
            toast.error('Fehler beim Laden');
        } finally {
            setLoading(false);
        }
    }

    async function markAsViewed(id) {
        try {
            await base44.entities.AIProactiveRecommendation.update(id, { status: 'viewed' });
        } catch (error) {
            toast.error('Fehler');
        }
    }

    async function dismiss(id) {
        try {
            await base44.entities.AIProactiveRecommendation.update(id, { status: 'dismissed' });
            toast.success('Empfehlung verworfen');
        } catch (error) {
            toast.error('Fehler');
        }
    }

    const typeIcons = {
        cost_optimization: <DollarSign className="w-5 h-5 text-green-600" />,
        efficiency_improvement: <TrendingUp className="w-5 h-5 text-blue-600" />,
        market_opportunity: <Lightbulb className="w-5 h-5 text-purple-600" />
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        AI-Empfehlungen
                    </CardTitle>
                    {recommendations.filter(r => r.status === 'new').length > 0 && (
                        <Badge variant="destructive">
                            {recommendations.filter(r => r.status === 'new').length} Neu
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8 text-slate-500">Lädt...</div>
                ) : recommendations.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        Keine Empfehlungen verfügbar
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recommendations.map(rec => (
                            <div 
                                key={rec.id}
                                className={`p-4 border rounded-lg ${rec.status === 'new' ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        {typeIcons[rec.recommendation_type]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="font-semibold flex items-center gap-2">
                                                    {rec.title}
                                                    <Badge variant="outline" className="text-xs">
                                                        Score: {rec.priority_score}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-700 mt-1">{rec.description}</p>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                variant="ghost"
                                                onClick={() => dismiss(rec.id)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {rec.potential_savings_eur > 0 && (
                                            <div className="text-sm font-semibold text-green-600 mt-2">
                                                💰 Einsparpotenzial: {rec.potential_savings_eur.toFixed(2)} €
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                                            <span>Aufwand: {rec.implementation_effort}</span>
                                            <span>•</span>
                                            <span>Konfidenz: {rec.ai_confidence}%</span>
                                        </div>

                                        {/* Markttrend-Quellen anzeigen */}
                                        {rec.data_sources && rec.data_sources.length > 0 && (
                                            <div className="mt-3 pt-2 border-t text-xs">
                                                <div className="text-gray-600 font-semibold mb-1">
                                                    📊 Basiert auf Marktdaten von:
                                                </div>
                                                <div className="text-gray-500">
                                                    {rec.data_sources.join(', ')}
                                                </div>
                                            </div>
                                        )}

                                        {rec.action_items?.length > 0 && (
                                            <div className="mt-3 p-2 bg-white rounded border">
                                                <div className="text-xs font-semibold mb-1">Handlungsschritte:</div>
                                                {rec.action_items.map((item, i) => (
                                                    <div key={i} className="text-xs text-slate-700">
                                                        • {item.action} {item.deadline && `(bis ${new Date(item.deadline).toLocaleDateString('de-DE')})`}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {rec.status === 'new' && (
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                className="mt-3"
                                                onClick={() => markAsViewed(rec.id)}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Zur Kenntnis genommen
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}