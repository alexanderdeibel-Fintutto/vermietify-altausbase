import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Loader2 } from 'lucide-react';

export default function CostOptimizationWidget() {
  const { data: latestAnalysis, isLoading } = useQuery({
    queryKey: ['costOptimization'],
    queryFn: async () => {
      try {
        const analyses = await base44.entities.CostOptimizationAnalysis.list('-analysis_date', 1);
        return analyses[0];
      } catch {
        return null;
      }
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!latestAnalysis) {
    return (
      <Card className="bg-slate-50">
        <CardContent className="pt-4 text-center">
          <p className="text-sm text-slate-600">Keine Kostenanalyse verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  const topOpportunities = latestAnalysis.cost_reduction_opportunities?.slice(0, 3) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-green-600" />
          Kostensenkungspotenziale
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-xs text-green-600 font-semibold mb-1">Gesamtsparpotential</p>
          <p className="text-2xl font-bold text-green-900">
            {latestAnalysis.total_potential_savings?.toLocaleString('de-DE')} €
          </p>
          <p className="text-xs text-green-700 mt-1">
            {latestAnalysis.savings_percentage}% der Gesamtausgaben
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600">Top Chancen</p>
          {topOpportunities.length > 0 ? (
            topOpportunities.map((opp, idx) => (
              <div key={idx} className="bg-slate-50 p-2 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{opp.category}</span>
                  <Badge className={
                    opp.priority === 'high'
                      ? 'bg-red-100 text-red-800 text-xs'
                      : opp.priority === 'medium'
                      ? 'bg-amber-100 text-amber-800 text-xs'
                      : 'bg-blue-100 text-blue-800 text-xs'
                  }>
                    {opp.savings_percentage}%
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mb-2">{opp.opportunity_description}</p>
                <div className="h-1.5 bg-slate-200 rounded overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${Math.min(100, opp.savings_percentage)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-600">Keine Chancen identifiziert</p>
          )}
        </div>

        {latestAnalysis.quick_wins && latestAnalysis.quick_wins.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded p-2">
            <p className="text-xs font-semibold text-amber-900 mb-2">
              💡 {latestAnalysis.quick_wins.length} schnelle Maßnahmen
            </p>
            <ul className="text-xs text-amber-900 space-y-1">
              {latestAnalysis.quick_wins.slice(0, 2).map((win, idx) => (
                <li key={idx}>• {win}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}