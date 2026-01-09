import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingDown, Zap, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function CostOptimizationPanel({ analysis }) {
  if (!analysis) {
    return (
      <Card className="bg-slate-50">
        <CardContent className="pt-4 text-center">
          <p className="text-sm text-slate-600">Keine Kostenanalyse verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return '✓';
      case 'medium':
        return '⚙️';
      default:
        return '⚠️';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <p className="text-xs text-green-700 font-semibold mb-1">Sparpotential</p>
            <p className="text-2xl font-bold text-green-900">
              {analysis.total_potential_savings?.toLocaleString('de-DE')} €
            </p>
            <p className="text-xs text-green-700 mt-1">{analysis.savings_percentage}% der Ausgaben</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <p className="text-xs text-blue-700 font-semibold mb-1">Chancen</p>
            <p className="text-2xl font-bold text-blue-900">
              {analysis.cost_reduction_opportunities?.length || 0}
            </p>
            <p className="text-xs text-blue-700 mt-1">Identifiziert</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-4">
            <p className="text-xs text-purple-700 font-semibold mb-1">Quick Wins</p>
            <p className="text-2xl font-bold text-purple-900">
              {analysis.quick_wins?.length || 0}
            </p>
            <p className="text-xs text-purple-700 mt-1">Sofort umsetzbar</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Wins */}
      {analysis.quick_wins && analysis.quick_wins.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              Sofortige Maßnahmen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.quick_wins.map((win, idx) => (
              <div key={idx} className="text-sm text-amber-900 p-2 bg-white rounded border border-amber-200">
                • {win}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cost Reduction Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-green-600" />
            Kostensenkungschancen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysis.cost_reduction_opportunities?.map((opp, idx) => (
            <div
              key={idx}
              className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{opp.category}</p>
                  <p className="text-xs text-slate-600 mt-1">{opp.opportunity_description}</p>
                </div>
                <Badge className={getPriorityColor(opp.priority)}>
                  {opp.priority.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                <div>
                  <p className="text-slate-600">Aktuell</p>
                  <p className="font-semibold">{opp.current_spending.toLocaleString('de-DE')} €</p>
                </div>
                <div>
                  <p className="text-slate-600">Sparpotential</p>
                  <p className="font-semibold text-green-700">
                    {opp.potential_savings.toLocaleString('de-DE')} €
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Prozent</p>
                  <p className="font-semibold text-green-700">{opp.savings_percentage}%</p>
                </div>
                <div>
                  <p className="text-slate-600">Aufwand</p>
                  <p className="font-semibold">
                    {getDifficultyIcon(opp.implementation_difficulty)}{' '}
                    {opp.implementation_difficulty}
                  </p>
                </div>
              </div>

              <div className="bg-slate-100 rounded h-2">
                <div
                  className="bg-green-600 h-2 rounded transition-all"
                  style={{
                    width: `${Math.min(100, (opp.savings_percentage / 100) * 100)}%`
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Budget Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Optimierte Budgetvorschläge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysis.budget_recommendations?.map((rec, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-sm">{rec.category}</p>
                <Badge variant="outline" className="text-xs">
                  Konfidenz: {rec.confidence}%
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                <div>
                  <p className="text-slate-600">Aktuell</p>
                  <p className="font-semibold">{rec.current_budget.toLocaleString('de-DE')} €</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-600">→</p>
                </div>
                <div>
                  <p className="text-slate-600">Empfohlen</p>
                  <p className="font-semibold text-blue-700">
                    {rec.recommended_budget.toLocaleString('de-DE')} €
                  </p>
                </div>
              </div>

              <Progress
                value={(rec.recommended_budget / rec.current_budget) * 100}
                className="h-2 mb-2"
              />

              <p className="text-xs text-slate-600 italic">{rec.reasoning}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      {analysis.trend_analysis && Object.keys(analysis.trend_analysis).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trend-Analyse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(analysis.trend_analysis).map(([category, trend]) => (
              <div
                key={category}
                className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs"
              >
                <div className="flex-1">
                  <p className="font-semibold">{category}</p>
                  <p className="text-slate-600">
                    Ø {trend.average.toLocaleString('de-DE')} € | Trend: {trend.trend}
                  </p>
                </div>
                <Badge
                  className={
                    trend.trend === 'increasing'
                      ? 'bg-red-100 text-red-800'
                      : trend.trend === 'decreasing'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-slate-100 text-slate-800'
                  }
                >
                  {trend.trend}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}