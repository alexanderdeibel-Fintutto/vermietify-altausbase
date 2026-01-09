import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingDown, DollarSign } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxLossHarvesting() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [analyze, setAnalyze] = useState(false);

  const { data: analysis = {}, isLoading } = useQuery({
    queryKey: ['taxLossHarvesting', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('suggestTaxLossHarvesting', {
        country,
        taxYear
      });
      return response.data?.analysis || {};
    },
    enabled: analyze
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🔄 Tax Loss Harvesting</h1>
        <p className="text-slate-500 mt-1">Verlustoptimierung zur Steuereinsparung</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            onClick={() => setAnalyze(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Analyse Starten
          </Button>
        </div>
      </div>

      {isLoading && analyze && (
        <div className="text-center py-8">⏳ Analyse läuft...</div>
      )}

      {analyze && analysis.suggestions && (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Potenzielle Ersparnis</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  €{Math.round(analysis.suggestions?.total_potential_savings || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Aktuelle Gewinne</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  €{Math.round(analysis.current_gains || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-blue-300 bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Verfügbare Verluste</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  €{Math.round(analysis.available_losses || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Wash Sale Warnings */}
          {(analysis.suggestions?.wash_sale_risks || []).length > 0 && (
            <Alert className="border-yellow-300 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <p className="font-bold mb-2">⚠️ Wash Sale Risiken:</p>
                <ul className="space-y-1 text-sm">
                  {analysis.suggestions.wash_sale_risks.map((risk, i) => (
                    <li key={i}>• {risk}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Harvest Recommendations */}
          {(analysis.suggestions?.harvest_recommendations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Realisierungs-Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.suggestions.harvest_recommendations.map((rec, i) => (
                  <div key={i} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold">{rec.asset || rec.name || `Empfehlung ${i + 1}`}</h4>
                      {rec.estimated_loss && (
                        <Badge className="bg-red-100 text-red-800">
                          -{rec.estimated_loss.toLocaleString()} €
                        </Badge>
                      )}
                    </div>
                    {rec.reason && <p className="text-sm text-slate-600 mb-2">{rec.reason}</p>}
                    {rec.timing && <p className="text-xs text-slate-500">⏱️ {rec.timing}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Implementation Steps */}
          {(analysis.suggestions?.implementation_steps || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">✅ Umsetzungsschritte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.suggestions.implementation_steps.map((step, i) => (
                  <div key={i} className="flex gap-3 p-2 bg-blue-50 rounded">
                    <span className="font-bold text-blue-600 flex-shrink-0">{i + 1}.</span>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Carryforward Strategy */}
          {analysis.suggestions?.carryforward_strategy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🔄 Verlustvortrag-Strategie</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{analysis.suggestions.carryforward_strategy}</p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {analysis.suggestions?.timeline && (
            <Alert className="border-blue-300 bg-blue-50">
              <AlertDescription className="text-slate-700">
                <p className="font-bold mb-2">📅 Zeitrahmen:</p>
                <p className="text-sm">{analysis.suggestions.timeline}</p>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}