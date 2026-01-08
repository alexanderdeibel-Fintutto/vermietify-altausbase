import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, TrendingDown, Brain, LineChart, 
  DollarSign, AlertTriangle, Loader2 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PredictiveTaxAnalytics() {
  const [analyzing, setAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analysiere die Steuerentwicklung und erstelle Prognosen für die nächsten 3 Jahre basierend auf aktuellen Trends in der Immobilienvermietung.

Berücksichtige:
- Historische Mieteinnahmen-Entwicklung
- Steigende Betriebskosten (Inflation ~3-4%)
- Energetische Sanierungen und deren steuerliche Auswirkungen
- AfA-Entwicklung
- Zinsänderungen bei Finanzierungen
- Regulatorische Änderungen (z.B. CO2-Bepreisung)
- Regionale Mietpreisentwicklung

Gib konkrete Zahlen für:
1. Prognostizierte Mieteinnahmen (3 Jahre)
2. Erwartete Werbungskosten (3 Jahre)
3. Geschätzter Überschuss (3 Jahre)
4. Steuerliche Belastung (3 Jahre)
5. Optimierungspotenzial (€ pro Jahr)
6. Risikofaktoren und deren Wahrscheinlichkeit
7. Handlungsempfehlungen mit Priorität`,
        response_json_schema: {
          type: 'object',
          properties: {
            current_year: {
              type: 'object',
              properties: {
                income: { type: 'number' },
                expenses: { type: 'number' },
                surplus: { type: 'number' },
                tax_burden: { type: 'number' }
              }
            },
            predictions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  year: { type: 'number' },
                  income: { type: 'number' },
                  expenses: { type: 'number' },
                  surplus: { type: 'number' },
                  tax_burden: { type: 'number' },
                  confidence: { type: 'number' }
                }
              }
            },
            optimization_potential: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  area: { type: 'string' },
                  annual_savings: { type: 'number' },
                  effort: { type: 'string' },
                  priority: { type: 'string' }
                }
              }
            },
            risk_factors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  factor: { type: 'string' },
                  probability: { type: 'string' },
                  impact: { type: 'string' },
                  mitigation: { type: 'string' }
                }
              }
            },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  action: { type: 'string' },
                  reason: { type: 'string' },
                  priority: { type: 'string' },
                  timeline: { type: 'string' }
                }
              }
            },
            summary: { type: 'string' }
          }
        }
      });

      setPredictions(response);
      toast.success('Prognose erstellt');
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const prepareChartData = () => {
    if (!predictions) return [];
    
    return [
      {
        year: 'Aktuell',
        Einnahmen: predictions.current_year.income,
        Ausgaben: predictions.current_year.expenses,
        Überschuss: predictions.current_year.surplus
      },
      ...predictions.predictions.map(p => ({
        year: p.year,
        Einnahmen: p.income,
        Ausgaben: p.expenses,
        Überschuss: p.surplus
      }))
    ];
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Predictive Tax Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!predictions ? (
          <div className="text-center py-8">
            <Brain className="w-16 h-16 mx-auto mb-4 text-purple-600" />
            <p className="text-slate-600 mb-4">
              KI-basierte Steuerprognose für die nächsten 3 Jahre
            </p>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              Prognose erstellen
            </Button>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-900">{predictions.summary}</p>
            </div>

            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Einnahmen" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="Ausgaben" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="Überschuss" stroke="#3b82f6" strokeWidth={2} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>

            {/* Optimization Potential */}
            <div>
              <h3 className="font-semibold mb-3">Optimierungspotenzial</h3>
              <div className="space-y-2">
                {predictions.optimization_potential?.map((opt, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{opt.area}</span>
                      <Badge className={priorityColors[opt.priority.toLowerCase()]}>
                        {opt.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Jährliche Einsparung:</span>
                      <span className="font-bold text-green-600">
                        {opt.annual_savings?.toLocaleString('de-DE')} €
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Aufwand: {opt.effort}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Factors */}
            <div>
              <h3 className="font-semibold mb-3">Risikofaktoren</h3>
              <div className="space-y-2">
                {predictions.risk_factors?.map((risk, idx) => (
                  <div key={idx} className="p-3 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-red-900">{risk.factor}</div>
                        <div className="text-xs text-red-700 mt-1">
                          Wahrscheinlichkeit: {risk.probability} | Auswirkung: {risk.impact}
                        </div>
                        <div className="text-xs text-red-600 mt-2">
                          <strong>Gegenmaßnahme:</strong> {risk.mitigation}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="font-semibold mb-3">Handlungsempfehlungen</h3>
              <div className="space-y-2">
                {predictions.recommendations?.map((rec, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{rec.action}</div>
                        <div className="text-xs text-slate-600 mt-1">{rec.reason}</div>
                      </div>
                      <Badge className={priorityColors[rec.priority.toLowerCase()]}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500">
                      Zeitrahmen: {rec.timeline}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setPredictions(null)}
              className="w-full"
            >
              Neue Prognose
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}