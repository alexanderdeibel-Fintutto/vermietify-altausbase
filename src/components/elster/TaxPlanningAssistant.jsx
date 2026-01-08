import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calculator, Lightbulb, TrendingUp, DollarSign,
  Target, Loader2, CheckCircle 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TaxPlanningAssistant() {
  const [scenario, setScenario] = useState({
    planned_renovation: '',
    expected_rent_increase: '',
    planned_investments: '',
    financing_changes: ''
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Als Steuerberater für Immobilien, analysiere folgendes Planungs-Szenario und gib steueroptimierte Empfehlungen:

GEPLANTE MASSNAHMEN:
- Sanierung/Renovierung: ${scenario.planned_renovation || 'Keine'}
- Erwartete Mieterhöhung: ${scenario.expected_rent_increase || 'Keine'}
- Geplante Investitionen: ${scenario.planned_investments || 'Keine'}
- Finanzierungsänderungen: ${scenario.financing_changes || 'Keine'}

Analysiere:
1. Steuerliche Auswirkungen jeder Maßnahme
2. Optimale zeitliche Umsetzung aus steuerlicher Sicht
3. Sofort absetzbar vs. AfA vs. nicht absetzbar
4. Wechselwirkungen zwischen Maßnahmen
5. Cashflow-Optimierung
6. Gesamtersparnis-Potenzial

Gib konkrete Empfehlungen mit:
- Maßnahme
- Empfohlener Zeitpunkt
- Steuerliche Behandlung
- Geschätzte Steuerersparnis
- Begründung`,
        response_json_schema: {
          type: 'object',
          properties: {
            scenarios: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  measure: { type: 'string' },
                  recommended_timing: { type: 'string' },
                  tax_treatment: { type: 'string' },
                  estimated_savings: { type: 'number' },
                  reasoning: { type: 'string' },
                  priority: { type: 'string' }
                }
              }
            },
            total_potential_savings: { type: 'number' },
            optimal_sequence: {
              type: 'array',
              items: { type: 'string' }
            },
            cashflow_impact: { type: 'string' },
            risks: {
              type: 'array',
              items: { type: 'string' }
            },
            next_steps: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      });

      setAnalysis(response);
      toast.success('Steuerplanung erstellt');
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          Steuerplanungs-Assistent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis ? (
          <>
            <div className="space-y-3">
              <div>
                <Label>Geplante Sanierung/Renovierung</Label>
                <Input
                  placeholder="z.B. Dachsanierung, Heizungserneuerung..."
                  value={scenario.planned_renovation}
                  onChange={(e) => setScenario({...scenario, planned_renovation: e.target.value})}
                />
              </div>

              <div>
                <Label>Erwartete Mieterhöhung</Label>
                <Input
                  placeholder="z.B. 5% ab 2025..."
                  value={scenario.expected_rent_increase}
                  onChange={(e) => setScenario({...scenario, expected_rent_increase: e.target.value})}
                />
              </div>

              <div>
                <Label>Geplante Investitionen</Label>
                <Input
                  placeholder="z.B. Photovoltaik, E-Ladesäulen..."
                  value={scenario.planned_investments}
                  onChange={(e) => setScenario({...scenario, planned_investments: e.target.value})}
                />
              </div>

              <div>
                <Label>Finanzierungsänderungen</Label>
                <Input
                  placeholder="z.B. Umschuldung, Sondertilgung..."
                  value={scenario.financing_changes}
                  onChange={(e) => setScenario({...scenario, financing_changes: e.target.value})}
                />
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Calculator className="w-4 h-4 mr-2" />
              )}
              Steueroptimierte Planung erstellen
            </Button>
          </>
        ) : (
          <>
            {/* Total Savings */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">Geschätztes Einsparpotenzial</span>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-5 h-5 text-green-700" />
                  <span className="text-2xl font-bold text-green-800">
                    {analysis.total_potential_savings?.toLocaleString('de-DE')} €
                  </span>
                </div>
              </div>
            </div>

            {/* Scenarios */}
            <div>
              <h3 className="font-semibold mb-3">Maßnahmen-Analyse</h3>
              <div className="space-y-3">
                {analysis.scenarios?.map((scenario, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium">{scenario.measure}</div>
                      <Badge className={priorityColors[scenario.priority?.toLowerCase()]}>
                        {scenario.priority}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-2 text-sm">
                      <div>
                        <span className="text-slate-600">Zeitpunkt:</span>
                        <div className="font-medium">{scenario.recommended_timing}</div>
                      </div>
                      <div>
                        <span className="text-slate-600">Behandlung:</span>
                        <div className="font-medium">{scenario.tax_treatment}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Geschätzte Ersparnis:</span>
                      <span className="font-bold text-green-600">
                        {scenario.estimated_savings?.toLocaleString('de-DE')} €
                      </span>
                    </div>

                    <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                      {scenario.reasoning}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimal Sequence */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Optimale Reihenfolge
              </h3>
              <div className="space-y-2">
                {analysis.optimal_sequence?.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <span className="text-sm text-blue-900">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cashflow Impact */}
            {analysis.cashflow_impact && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="font-medium text-sm text-yellow-900 mb-2">
                  Cashflow-Auswirkung
                </div>
                <p className="text-sm text-yellow-800">{analysis.cashflow_impact}</p>
              </div>
            )}

            {/* Risks */}
            {analysis.risks && analysis.risks.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Zu beachten</h3>
                <div className="space-y-2">
                  {analysis.risks.map((risk, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span className="text-red-700">{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div>
              <h3 className="font-semibold mb-3">Nächste Schritte</h3>
              <div className="space-y-2">
                {analysis.next_steps?.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setAnalysis(null)}
              className="w-full"
            >
              Neue Planung
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}