import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, Zap, Target, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function AITaxRecommendations() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: recommendations = {}, isLoading } = useQuery({
    queryKey: ['aiTaxRecommendations', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateAITaxRecommendations', {
        country,
        taxYear
      });
      return response.data?.recommendations || {};
    }
  });

  const analysis = recommendations.ai_analysis || {};
  const profile = recommendations.profile || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🤖 AI Steuererkenntnis</h1>
        <p className="text-slate-500 mt-1">Personalisierte Empfehlungen für maximale Steuerersparnis</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry}>
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
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
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
      </div>

      {isLoading ? (
        <div className="text-center py-8">🤖 KI analysiert Ihre Steuersituation...</div>
      ) : (
        <>
          {/* Profile Summary */}
          {profile.total_tax > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-blue-300 bg-blue-50">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600">Geschätzte Steuerersparnis</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    €{Math.round(analysis.total_potential_savings || 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-green-300 bg-green-50">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600">Einrichtungsdauer</p>
                  <p className="text-lg font-bold text-green-600 mt-2">{analysis.implementation_timeline || '1-2 Wochen'}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Immediate Opportunities */}
          {(analysis.immediate_opportunities || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  🎯 Sofort umsetzbar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.immediate_opportunities.map((opp, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm">{opp.title}</h4>
                      {opp.potential_savings > 0 && (
                        <Badge className="bg-green-600 text-white">
                          €{Math.round(opp.potential_savings).toLocaleString()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{opp.description}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">{opp.effort_level}</Badge>
                      <Badge variant="outline" className="text-xs">{opp.timeline}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Medium-term Strategies */}
          {(analysis.medium_term_strategies || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  📈 Mittelfristige Strategien (3-12 Monate)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.medium_term_strategies.map((strategy, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-slate-50 rounded">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {strategy}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Long-term Planning */}
          {(analysis.long_term_planning || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  🚀 Langfristige Planung (1+ Jahre)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.long_term_planning.map((plan, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-slate-50 rounded">
                    <span className="text-purple-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {plan}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Risk Areas */}
          {(analysis.risk_areas || []).length > 0 && (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  ⚠️ Risikobereich zu beachten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.risk_areas.map((risk, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-white rounded">
                    <span className="text-yellow-600 font-bold">!</span>
                    {risk}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Compliance Checklist */}
          {(analysis.compliance_checklist || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">✅ Compliance-Checkliste</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.compliance_checklist.map((item, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-slate-50 rounded">
                    <span className="text-green-600">☑</span>
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}