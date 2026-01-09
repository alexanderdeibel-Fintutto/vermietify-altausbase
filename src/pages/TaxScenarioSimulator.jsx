import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, DollarSign } from 'lucide-react';

export default function TaxScenarioSimulator() {
  const [taxYear] = useState(new Date().getFullYear() - 1);
  const [scenarios, setScenarios] = useState([
    { name: 'Baseline', type: 'current' },
    { name: 'Salary +50k', salary_increase: 50000 },
    { name: 'Crypto +100k', crypto_gains: 100000 },
    { name: 'Freelance Income +30k', freelance_income: 30000 }
  ]);
  const [results, setResults] = useState(null);

  const simulate = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('runTaxScenarioSimulation', {
        tax_year: taxYear,
        scenarios: scenarios.filter(s => s.type !== 'current')
      });
      return res.data;
    },
    onSuccess: (data) => setResults(data)
  });

  const addScenario = () => {
    setScenarios([...scenarios, { name: 'New Scenario' }]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light">Steuerszenario-Simulator</h1>
        <p className="text-slate-500 font-light mt-2">Simuliere verschiedene Tax Szenarien für {taxYear}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Szenarien definieren</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {scenarios.map((scenario, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-2">
              <Input
                placeholder="Szenario Name"
                value={scenario.name}
                onChange={(e) => {
                  const updated = [...scenarios];
                  updated[i].name = e.target.value;
                  setScenarios(updated);
                }}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Salary Increase"
                  value={scenario.salary_increase || ''}
                  onChange={(e) => {
                    const updated = [...scenarios];
                    updated[i].salary_increase = parseInt(e.target.value) || 0;
                    setScenarios(updated);
                  }}
                />
                <Input
                  type="number"
                  placeholder="Crypto Gains"
                  value={scenario.crypto_gains || ''}
                  onChange={(e) => {
                    const updated = [...scenarios];
                    updated[i].crypto_gains = parseInt(e.target.value) || 0;
                    setScenarios(updated);
                  }}
                />
              </div>
            </div>
          ))}
          <Button onClick={addScenario} variant="outline" className="w-full">
            + Szenario hinzufügen
          </Button>
          <Button 
            onClick={() => simulate.mutate()}
            disabled={simulate.isPending}
            className="w-full"
          >
            {simulate.isPending ? 'Simuliere...' : 'Szenarien simulieren'}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-3">
          <h2 className="text-lg font-light">Ergebnisse</h2>
          {results.results?.map((result, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-light text-sm">{result.scenario_name}</p>
                    <p className="text-xs text-slate-500 font-light mt-1">
                      Effektiver Satz: {(result.effective_rate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-light text-sm">${result.estimated_tax?.toLocaleString()}</p>
                    <p className={`text-xs font-light mt-1 ${result.tax_increase > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {result.tax_increase > 0 ? '+' : ''}{result.tax_increase?.toLocaleString()}
                    </p>
                  </div>
                </div>
                {result.mitigation_strategies?.length > 0 && (
                  <div className="mt-3 p-2 bg-blue-50 rounded text-xs font-light">
                    <p className="text-blue-900 mb-1">Optimierungen:</p>
                    {result.mitigation_strategies.map((s, j) => (
                      <p key={j}>• {s}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}