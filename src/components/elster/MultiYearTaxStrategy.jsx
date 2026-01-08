import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, TrendingUp, Target } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function MultiYearTaxStrategy() {
  const [analyzing, setAnalyzing] = useState(false);
  const [strategy, setStrategy] = useState(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Erstelle eine Mehrjahres-Steuerstrategie (5 Jahre) für Immobilienvermietung.

Analysiere:
1. Optimale zeitliche Verteilung von Investitionen
2. AfA-Optimierung über mehrere Jahre
3. Sanierungsplanung
4. Rücklagenbildung
5. Expansion vs. Konsolidierung

Für jedes Jahr (2024-2028):
- Empfohlene Maßnahmen
- Geschätzte Steuerlast
- Investitions-Budget
- Cashflow-Projektion
- Risiken und Chancen

Berücksichtige:
- Degressive vs. lineare AfA
- 15%-Regel für Erhaltungsaufwand
- Steuerliche Verlustvorträge
- Gewerbesteuer-Grenzwerte`,
        response_json_schema: {
          type: 'object',
          properties: {
            years: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  year: { type: 'number' },
                  recommended_actions: { type: 'array', items: { type: 'string' } },
                  estimated_tax: { type: 'number' },
                  investment_budget: { type: 'number' },
                  cashflow_projection: { type: 'number' },
                  risks: { type: 'array', items: { type: 'string' } },
                  opportunities: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            overall_strategy: { type: 'string' },
            total_tax_savings: { type: 'number' }
          }
        }
      });

      setStrategy(response);
      toast.success('Strategie erstellt');
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Mehrjahres-Steuerstrategie
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!strategy ? (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600 mb-4">
              Erstellt eine 5-Jahres-Steuerstrategie mit Investitionsplan
            </p>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Target className="w-4 h-4 mr-2" />
              )}
              Strategie erstellen
            </Button>
          </div>
        ) : (
          <>
            {/* Overall Summary */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
              <div className="font-medium mb-2">Gesamt-Strategie</div>
              <p className="text-sm text-slate-700 mb-3">{strategy.overall_strategy}</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="font-bold text-green-700">
                  Geschätzte Steuerersparnis: {strategy.total_tax_savings?.toLocaleString('de-DE')} €
                </span>
              </div>
            </div>

            {/* Year-by-Year Plan */}
            <div className="space-y-3">
              {strategy.years?.map((year, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-lg">{year.year}</div>
                    <Badge variant="outline">
                      Jahr {idx + 1}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="text-xs text-blue-600">Steuerlast</div>
                      <div className="font-bold text-blue-700">
                        {year.estimated_tax?.toLocaleString('de-DE')} €
                      </div>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <div className="text-xs text-green-600">Investment</div>
                      <div className="font-bold text-green-700">
                        {year.investment_budget?.toLocaleString('de-DE')} €
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-sm font-medium mb-2">Empfohlene Maßnahmen:</div>
                    <ul className="text-sm space-y-1">
                      {year.recommended_actions?.map((action, aIdx) => (
                        <li key={aIdx} className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span className="text-slate-700">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {year.opportunities?.length > 0 && (
                    <div className="text-xs p-2 bg-green-50 border border-green-200 rounded">
                      <strong>Chancen:</strong> {year.opportunities.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => setStrategy(null)}
              className="w-full"
            >
              Neue Strategie
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}