import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingDown, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxPlanningAdvisor() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [canton, setCanton] = useState('ZH');

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['taxOptimizations', country, taxYear, canton],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('generateTaxOptimizationPlan', {
        country,
        taxYear,
        canton: country === 'CH' ? canton : undefined
      });
      return data.recommendations || [];
    },
    enabled: !!country && !!taxYear
  });

  const implementMutation = useMutation({
    mutationFn: async (recommendation) => {
      // Create planning record
      await base44.entities.TaxPlanning.create({
        user_email: (await base44.auth.me()).email,
        country,
        tax_year: taxYear,
        planning_type: recommendation.planning_type,
        title: recommendation.title,
        description: recommendation.description,
        estimated_savings: recommendation.estimated_savings,
        implementation_effort: recommendation.implementation_effort,
        risk_level: recommendation.risk_level,
        deadline: recommendation.deadline,
        status: 'planned'
      });
    }
  });

  const riskColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  const effortIcons = {
    low: '⚡',
    medium: '⏱️',
    high: '🔧'
  };

  const totalSavings = recommendations.reduce((s, r) => s + (r.estimated_savings || 0), 0);
  const highRiskCount = recommendations.filter(r => r.risk_level === 'high').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🎯 Tax Planning Advisor</h1>
        <p className="text-slate-500 mt-1">Maßgeschneiderte Optimierungsempfehlungen für Ihr Steuerjahr</p>
      </div>

      {/* Country Selection */}
      <div className="flex gap-4">
        <div className="flex-1 max-w-xs">
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

        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={taxYear.toString()} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {country === 'CH' && (
          <div className="flex-1 max-w-xs">
            <label className="text-sm font-medium">Kanton</label>
            <Select value={canton} onValueChange={setCanton}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['ZH', 'BE', 'LU', 'AG', 'SG', 'BS', 'BL', 'VD', 'GE'].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Summary */}
      {recommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-600">Empfehlungen</p>
                <p className="text-3xl font-bold">{recommendations.length}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Geschätzte Ersparnisse</p>
                <p className="text-3xl font-bold">
                  {totalSavings > 1000 ? '€' : '€'}
                  {(totalSavings / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })}K
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Durchschn. Aufwand</p>
                <p className="text-3xl font-bold">
                  {recommendations.filter(r => r.implementation_effort === 'low').length > 
                   recommendations.filter(r => r.implementation_effort === 'high').length ? 
                   '⚡ Niedrig' : '🔧 Hoch'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Warning */}
      {highRiskCount > 0 && (
        <Alert className="border-orange-300 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            ⚠️ {highRiskCount} Empfehlung(en) mit hohem Risiko. Konsultieren Sie einen Steuerberater vor der Umsetzung.
          </AlertDescription>
        </Alert>
      )}

      {/* Recommendations */}
      {isLoading ? (
        <div className="text-center py-8 text-slate-500">
          ⏳ Analysiere Optimierungspotenziale...
        </div>
      ) : recommendations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-slate-500">
            Keine Optimierungsmöglichkeiten gefunden. Ihre Steuersituation ist optimal strukturiert! ✅
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{rec.title}</h3>
                      <Badge className={riskColors[rec.risk_level]}>
                        {rec.risk_level === 'low' ? '✅ Sicher' : 
                         rec.risk_level === 'medium' ? '⚠️ Moderat' : '🔴 Risiko'}
                      </Badge>
                      <Badge variant="outline">
                        {effortIcons[rec.implementation_effort]} {
                          rec.implementation_effort === 'low' ? 'Einfach' :
                          rec.implementation_effort === 'medium' ? 'Mittel' : 'Aufwändig'
                        }
                      </Badge>
                    </div>

                    <p className="text-slate-600 mb-3">{rec.description}</p>

                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Geschätzte Ersparnisse:</span>
                        <p className="font-semibold text-green-600">
                          €{(rec.estimated_savings || 0).toLocaleString('de-DE')}
                        </p>
                      </div>
                      {rec.deadline && (
                        <div>
                          <span className="text-slate-600">Deadline:</span>
                          <p className="font-semibold">{new Date(rec.deadline).toLocaleDateString('de-DE')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => implementMutation.mutate(rec)}
                    className="bg-blue-600 hover:bg-blue-700 gap-2 whitespace-nowrap"
                    size="sm"
                  >
                    <Zap className="w-4 h-4" /> Planen
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer */}
      <Alert className="bg-blue-50 border-blue-300">
        <AlertDescription className="text-blue-900">
          💡 <strong>Hinweis:</strong> Dies sind Vorschläge basierend auf Ihren Daten. 
          Konsultieren Sie einen Steuerberater für verbindliche Beratung.
        </AlertDescription>
      </Alert>
    </div>
  );
}