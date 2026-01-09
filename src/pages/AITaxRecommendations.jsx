import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, TrendingDown, Clock, Target } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function AITaxRecommendations() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [generating, setGenerating] = useState(false);

  const { data: recommendations = {}, isLoading } = useQuery({
    queryKey: ['aiTaxRecommendations', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateAITaxRecommendations', {
        country,
        taxYear
      });
      return response.data?.recommendations || {};
    },
    enabled: generating
  });

  const getPriorityColor = (priority) => {
    if (priority >= 8) return 'bg-red-100 text-red-800';
    if (priority >= 5) return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getRiskColor = (risk) => {
    if (risk === 'high') return 'bg-red-100 text-red-800';
    if (risk === 'medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🤖 AI Steuer-Empfehlungen</h1>
        <p className="text-slate-500 mt-1">Personalisierte KI-gestützte Optimierungsvorschläge</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry} disabled={generating}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
              <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
              <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={generating}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 1, CURRENT_YEAR].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setGenerating(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50"
            disabled={generating}
          >
            {generating ? '⏳ Wird generiert...' : 'Empfehlungen generieren'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Empfehlungen werden generiert...</div>
      ) : generating && recommendations.content ? (
        <>
          {/* Total Estimated Savings */}
          {recommendations.content.total_estimated_savings && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-600">Geschätzte Gesamteinsparungen</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      €{Math.round(recommendations.content.total_estimated_savings).toLocaleString()}
                    </p>
                  </div>
                  <TrendingDown className="w-12 h-12 text-green-300" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Immediate Actions */}
          {(recommendations.content.immediate_actions || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  🚨 Sofortige Maßnahmen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.content.immediate_actions.map((action, i) => (
                  <div key={i} className="border-l-4 border-red-300 pl-3 py-2 bg-red-50 p-3 rounded">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{action.action}</p>
                        {action.benefit && (
                          <p className="text-xs text-green-600 mt-1">
                            Einsparung: €{Math.round(action.benefit).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-2">
                        <Badge className={getPriorityColor(action.priority)}>
                          P{action.priority}
                        </Badge>
                        <Badge className={getRiskColor(action.risk_level)}>
                          {action.risk_level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Medium Term Opportunities */}
          {(recommendations.content.medium_term_opportunities || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  📅 Mittelfristige Chancen (6 Monate)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.content.medium_term_opportunities.map((opp, i) => (
                  <div key={i} className="border-l-4 border-blue-300 pl-3 py-2 bg-blue-50 p-3 rounded">
                    <p className="font-medium text-sm">{opp.opportunity}</p>
                    {opp.potential_savings && (
                      <p className="text-xs text-slate-600 mt-1">
                        💰 Potential: €{Math.round(opp.potential_savings).toLocaleString()}
                      </p>
                    )}
                    {opp.timeline_months && (
                      <p className="text-xs text-slate-600">
                        ⏱️ Zeitrahmen: {opp.timeline_months} Monate
                      </p>
                    )}
                    {(opp.requirements || []).length > 0 && (
                      <div className="text-xs mt-2">
                        <p className="text-slate-600">Anforderungen:</p>
                        <ul className="mt-1 space-y-1">
                          {opp.requirements.map((req, j) => (
                            <li key={j}>• {req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Long Term Strategies */}
          {(recommendations.content.long_term_strategies || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  🎯 Langfristige Strategien
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.content.long_term_strategies.map((strategy, i) => (
                  <div key={i} className="border-l-4 border-purple-300 pl-3 py-2 bg-purple-50 p-3 rounded">
                    <p className="font-medium text-sm">{strategy.strategy}</p>
                    <p className="text-xs text-slate-600 mt-1">{strategy.description}</p>
                    {strategy.long_term_benefit && (
                      <p className="text-xs text-purple-600 mt-1 font-medium">
                        {strategy.long_term_benefit}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Risk Warnings */}
          {(recommendations.content.risk_warnings || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  ⚠️ Risikowarnungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recommendations.content.risk_warnings.map((warning, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {warning}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Klicken Sie "Empfehlungen generieren", um personalisierte AI-Vorschläge zu erhalten
        </div>
      )}
    </div>
  );
}