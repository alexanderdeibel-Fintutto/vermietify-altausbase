import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, TrendingDown, TrendingUp, Clock, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TaxHarvesting() {
    const currentYear = new Date().getFullYear();
    const queryClient = useQueryClient();

    const { data: suggestions = [] } = useQuery({
        queryKey: ['taxSuggestions'],
        queryFn: async () => {
            const allSuggestions = await base44.entities.TaxHarvestingSuggestion.list();
            return allSuggestions.filter(s => s.status === 'pending').sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
        }
    });

    const { data: assets = [] } = useQuery({
        queryKey: ['assets'],
        queryFn: () => base44.entities.Asset.list()
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => base44.entities.TaxHarvestingSuggestion.update(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['taxSuggestions']);
            toast.success('Status aktualisiert');
        }
    });

    const getPriorityBadge = (priority) => {
        const config = {
            high: { label: 'Dringend', className: 'bg-red-100 text-red-700 border-red-200' },
            medium: { label: 'Mittel', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
            low: { label: 'Niedrig', className: 'bg-blue-100 text-blue-700 border-blue-200' }
        };
        const { label, className } = config[priority] || config.low;
        return <Badge variant="outline" className={className}>{label}</Badge>;
    };

    const getSuggestionIcon = (type) => {
        const icons = {
            realize_loss: <TrendingDown className="h-5 w-5 text-red-600" />,
            realize_gain_tax_free: <TrendingUp className="h-5 w-5 text-green-600" />,
            defer_sale: <Clock className="h-5 w-5 text-yellow-600" />,
            use_allowance: <Calendar className="h-5 w-5 text-blue-600" />
        };
        return icons[type] || <Info className="h-5 w-5 text-slate-600" />;
    };

    const getSuggestionTitle = (type) => {
        const titles = {
            realize_loss: 'Verlust realisieren',
            realize_gain_tax_free: 'Steuerfreien Gewinn realisieren',
            defer_sale: 'Verkauf verschieben',
            use_allowance: 'Sparerpauschbetrag nutzen'
        };
        return titles[type] || type;
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-light text-slate-900">Tax-Loss Harvesting</h1>
                <p className="text-slate-500 mt-1">Optimieren Sie Ihre Steuerlast durch strategische Verkäufe</p>
            </div>

            {/* Erklärungsbox */}
            <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                    <p className="font-medium mb-2">Was ist Tax-Loss Harvesting?</p>
                    <p className="text-sm text-blue-700">
                        Tax-Loss Harvesting ist eine Strategie, bei der Verluste aus Wertpapierverkäufen gezielt realisiert werden, 
                        um Gewinne zu verrechnen und die Steuerlast zu senken. Die Empfehlungen basieren auf Ihrer aktuellen 
                        Portfoliosituation und berücksichtigen Spekulationsfristen sowie den Sparerpauschbetrag.
                    </p>
                </AlertDescription>
            </Alert>

            {/* Vorschläge */}
            {suggestions.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <p className="text-lg font-medium text-slate-900 mb-2">Keine Vorschläge verfügbar</p>
                        <p className="text-slate-500 mb-4">
                            Ihr Portfolio ist aktuell optimal aufgestellt oder es gibt keine sinnvollen 
                            Tax-Loss Harvesting Möglichkeiten.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {suggestions.map(suggestion => {
                        const asset = assets.find(a => a.id === suggestion.asset_id);
                        
                        return (
                            <Card key={suggestion.id} className="border-2 hover:border-slate-300 transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            {getSuggestionIcon(suggestion.suggestion_type)}
                                        </div>
                                        
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-lg font-medium text-slate-900">
                                                            {getSuggestionTitle(suggestion.suggestion_type)}
                                                        </h3>
                                                        {getPriorityBadge(suggestion.priority)}
                                                    </div>
                                                    <p className="text-sm text-slate-600">
                                                        {asset?.name || 'Unbekanntes Asset'} ({asset?.symbol || '-'})
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-slate-600">Steuerersparnis</div>
                                                    <div className="text-2xl font-light text-green-600">
                                                        {suggestion.estimated_tax_savings.toFixed(2)} €
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-slate-600">Unrealisierter G/V:</span>
                                                        <span className={`ml-2 font-medium ${
                                                            suggestion.current_unrealized_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            {suggestion.current_unrealized_gain_loss >= 0 ? '+' : ''}
                                                            {suggestion.current_unrealized_gain_loss.toFixed(2)} €
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-600">Empfohlene Menge:</span>
                                                        <span className="ml-2 font-medium text-slate-900">
                                                            {suggestion.suggested_quantity.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {suggestion.days_until_tax_exempt !== null && suggestion.days_until_tax_exempt > 0 && (
                                                    <div className="text-sm">
                                                        <span className="text-slate-600">Tage bis Steuerfreiheit:</span>
                                                        <span className="ml-2 font-medium text-yellow-600">
                                                            {suggestion.days_until_tax_exempt} Tage
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="pt-2 border-t border-slate-200">
                                                    <p className="text-sm text-slate-700">{suggestion.reasoning}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Link to={`${createPageUrl('TaxSimulation')}?holding=${suggestion.asset_holding_id}`}>
                                                    <Button variant="default" size="sm">
                                                        Simulation starten
                                                    </Button>
                                                </Link>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => updateStatusMutation.mutate({ id: suggestion.id, status: 'rejected' })}
                                                >
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Verwerfen
                                                </Button>
                                                <div className="text-xs text-slate-500 ml-auto">
                                                    Gültig bis: {new Date(suggestion.valid_until).toLocaleDateString('de-DE')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}