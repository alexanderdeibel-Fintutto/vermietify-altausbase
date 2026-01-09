import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronUp, Lightbulb, TrendingDown, CheckCircle2 } from 'lucide-react';

export default function TaxOptimizationPanel({ country, taxYear, canton }) {
  const [expandedId, setExpandedId] = useState(null);

  const { data: optimizations, isLoading } = useQuery({
    queryKey: ['taxOptimizations', country, taxYear, canton],
    queryFn: async () => {
      if (country === 'AT') {
        const { data } = await base44.functions.invoke('generateTaxOptimizationAT', { taxYear });
        return data;
      } else if (country === 'CH') {
        const { data } = await base44.functions.invoke('generateTaxOptimizationCH', { taxYear, canton });
        return data;
      }
      return null;
    },
    enabled: !!country && !!taxYear
  });

  if (isLoading) {
    return <div className="text-center py-4">⏳ Analysiere Optimierungspotenziale...</div>;
  }

  if (!optimizations || optimizations.recommendations.length === 0) {
    return null;
  }

  const { recommendations, summary } = optimizations;
  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  const priorityIcons = {
    high: '🔴',
    medium: '🟡',
    low: '🔵'
  };

  return (
    <Card className="border-2 border-green-300 bg-green-50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" /> Steueroptimierungen
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              {summary.totalRecommendations} Empfehlungen mit {summary.highPriority} hoher Priorität
            </p>
          </div>
          <Badge className="bg-green-200 text-green-800 text-lg px-3 py-1">
            <TrendingDown className="w-4 h-4 inline mr-2" />
            {summary.totalPotentialSavings.toLocaleString('de-DE')}
            {country === 'AT' ? '€' : 'CHF'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, idx) => (
          <div
            key={rec.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${priorityColors[rec.priority]}`}
            onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{priorityIcons[rec.priority]}</span>
                  <h3 className="font-bold">{rec.title}</h3>
                  <Badge variant="outline" className="text-xs">
                    Ersparnisse: {rec.potentialSavings.toLocaleString('de-DE')}
                    {country === 'AT' ? '€' : 'CHF'}
                  </Badge>
                </div>
                <p className="text-sm mt-2">{rec.description}</p>
              </div>
              {expandedId === rec.id ? (
                <ChevronUp className="w-5 h-5 mt-1" />
              ) : (
                <ChevronDown className="w-5 h-5 mt-1" />
              )}
            </div>

            {expandedId === rec.id && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-2">📋 Empfehlung:</h4>
                  <p className="text-sm">{rec.recommendation}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">💡 Auswirkung:</h4>
                  <p className="text-sm">{rec.impact}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">💰 Potenzielle Ersparnis:</h4>
                  <p className="text-lg font-bold">
                    {rec.potentialSavings.toLocaleString('de-DE')}
                    {country === 'AT' ? '€' : 'CHF'}
                  </p>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700 gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Maßnahme implementieren
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}