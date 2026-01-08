import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calculator, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TaxScenarioSimulator() {
  const [simulating, setSimulating] = useState(false);
  const [scenarios, setScenarios] = useState(null);
  const [params, setParams] = useState({
    current_income: '',
    planned_expenses: '',
    renovation_costs: '',
    new_property: ''
  });

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Simuliere verschiedene Steuer-Szenarien basierend auf folgenden Parametern:

AKTUELL:
- Mieteinnahmen: ${params.current_income} €
- Werbungskosten: ${params.planned_expenses} €

GEPLANT:
- Sanierung: ${params.renovation_costs} €
- Neue Immobilie: ${params.new_property} €

Erstelle 4 Szenarien:
1. STATUS QUO - Keine Änderungen
2. OPTIMIERT - Optimale zeitliche Verteilung
3. SANIERUNG DIESES JAHR - Volle Sanierung jetzt
4. SANIERUNG VERTEILT - Über 2-3 Jahre verteilt

Für jedes Szenario:
- Geschätzte Steuerlast
- Cashflow-Auswirkung
- Empfehlung (Pro/Contra)
- Zeitplan
- Risiken`,
        response_json_schema: {
          type: 'object',
          properties: {
            scenarios: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  estimated_tax: { type: 'number' },
                  cashflow_impact: { type: 'number' },
                  recommendation: { type: 'string' },
                  timeline: { type: 'string' },
                  pros: { type: 'array', items: { type: 'string' } },
                  cons: { type: 'array', items: { type: 'string' } },
                  risk_level: { type: 'string' }
                }
              }
            }
          }
        }
      });

      setScenarios(response.scenarios);
      toast.success('Szenarien berechnet');
    } catch (error) {
      toast.error('Simulation fehlgeschlagen');
      console.error(error);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          Steuer-Szenario Simulator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!scenarios ? (
          <>
            <div className="space-y-3">
              <div>
                <Label>Aktuelle Mieteinnahmen (€/Jahr)</Label>
                <Input
                  type="number"
                  value={params.current_income}
                  onChange={(e) => setParams({...params, current_income: e.target.value})}
                  placeholder="50000"
                />
              </div>
              <div>
                <Label>Geplante Werbungskosten (€/Jahr)</Label>
                <Input
                  type="number"
                  value={params.planned_expenses}
                  onChange={(e) => setParams({...params, planned_expenses: e.target.value})}
                  placeholder="15000"
                />
              </div>
              <div>
                <Label>Geplante Sanierung (€)</Label>
                <Input
                  type="number"
                  value={params.renovation_costs}
                  onChange={(e) => setParams({...params, renovation_costs: e.target.value})}
                  placeholder="100000"
                />
              </div>
              <div>
                <Label>Neue Immobilie Kaufpreis (€)</Label>
                <Input
                  type="number"
                  value={params.new_property}
                  onChange={(e) => setParams({...params, new_property: e.target.value})}
                  placeholder="500000"
                />
              </div>
            </div>

            <Button
              onClick={handleSimulate}
              disabled={simulating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {simulating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Calculator className="w-4 h-4 mr-2" />
              )}
              Szenarien berechnen
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-3">
              {scenarios.map((scenario, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium">{scenario.name}</div>
                    <Badge variant={
                      scenario.risk_level === 'niedrig' ? 'default' :
                      scenario.risk_level === 'mittel' ? 'secondary' :
                      'destructive'
                    }>
                      {scenario.risk_level}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="text-xs text-blue-600">Steuerlast</div>
                      <div className="font-bold text-blue-700">
                        {scenario.estimated_tax?.toLocaleString('de-DE')} €
                      </div>
                    </div>
                    <div className={`p-2 rounded ${
                      scenario.cashflow_impact >= 0 ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className={`text-xs ${
                        scenario.cashflow_impact >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Cashflow
                      </div>
                      <div className={`font-bold flex items-center gap-1 ${
                        scenario.cashflow_impact >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {scenario.cashflow_impact >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(scenario.cashflow_impact || 0).toLocaleString('de-DE')} €
                      </div>
                    </div>
                  </div>

                  <div className="text-sm mb-2">
                    <strong>Zeitplan:</strong> {scenario.timeline}
                  </div>

                  <div className="text-sm text-slate-700 bg-slate-50 p-2 rounded">
                    {scenario.recommendation}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => setScenarios(null)}
              className="w-full"
            >
              Neue Simulation
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}