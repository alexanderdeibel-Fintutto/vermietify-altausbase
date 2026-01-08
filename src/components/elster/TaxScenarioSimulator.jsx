import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TaxScenarioSimulator({ submissionId }) {
  const [scenarios, setScenarios] = useState([
    { name: 'Basis', changes: {} }
  ]);
  const [results, setResults] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const addScenario = () => {
    setScenarios([...scenarios, { 
      name: `Szenario ${scenarios.length}`, 
      changes: {} 
    }]);
  };

  const runSimulation = async () => {
    setSimulating(true);
    try {
      const response = await base44.functions.invoke('simulateTaxScenario', {
        base_submission_id: submissionId,
        scenarios: scenarios.slice(1) // Skip Basis
      });

      if (response.data.success) {
        setResults(response.data);
        toast.success('Simulation abgeschlossen');
      }
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
          <Calculator className="w-5 h-5" />
          Steuer-Szenarien simulieren
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {scenarios.map((scenario, idx) => (
          idx > 0 && (
            <div key={idx} className="p-3 border rounded-lg space-y-2">
              <Input
                value={scenario.name}
                onChange={(e) => {
                  const updated = [...scenarios];
                  updated[idx].name = e.target.value;
                  setScenarios(updated);
                }}
                placeholder="Szenario-Name"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Einnahmen</Label>
                  <Input
                    type="number"
                    placeholder="z.B. 50000"
                    onChange={(e) => {
                      const updated = [...scenarios];
                      updated[idx].changes.einnahmen_gesamt = parseFloat(e.target.value);
                      setScenarios(updated);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Werbungskosten</Label>
                  <Input
                    type="number"
                    placeholder="z.B. 15000"
                    onChange={(e) => {
                      const updated = [...scenarios];
                      updated[idx].changes.werbungskosten_gesamt = parseFloat(e.target.value);
                      setScenarios(updated);
                    }}
                  />
                </div>
              </div>
            </div>
          )
        ))}

        <div className="flex gap-2">
          <Button onClick={addScenario} variant="outline" size="sm" className="flex-1">
            + Szenario
          </Button>
          <Button onClick={runSimulation} disabled={simulating} className="flex-1">
            {simulating ? 'Berechne...' : 'Simulieren'}
          </Button>
        </div>

        {results && (
          <div className="space-y-3 pt-4 border-t">
            <div className="text-sm font-medium">Ergebnisse:</div>
            {results.scenarios.map((scenario, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                <div className="font-medium mb-2">{scenario.scenario_name}</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-slate-600">Einkünfte</div>
                    <div className="font-medium">
                      €{scenario.calculated.einkuenfte.toLocaleString('de-DE')}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600">Geschätzte Steuerlast</div>
                    <div className="font-medium">
                      €{scenario.calculated.geschaetzte_steuerlast.toLocaleString('de-DE')}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {scenario.comparison.differenz_zur_basis > 0 ? (
                    <TrendingUp className="w-4 h-4 text-red-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-600" />
                  )}
                  <span className="text-xs">
                    {scenario.comparison.differenz_zur_basis > 0 ? '+' : ''}
                    €{Math.abs(scenario.comparison.differenz_zur_basis).toLocaleString('de-DE')}
                    {' '}({scenario.comparison.prozentuale_aenderung > 0 ? '+' : ''}
                    {scenario.comparison.prozentuale_aenderung}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}