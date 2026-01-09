import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, Play } from 'lucide-react';

const scenarioTemplates = [
  { id: 'bull_market', label: 'Bullischer Markt (+20%)', color: 'text-green-600' },
  { id: 'bear_market', label: 'Bärischer Markt (-20%)', color: 'text-red-600' },
  { id: 'stagflation', label: 'Stagflation', color: 'text-orange-600' },
  { id: 'recession', label: 'Rezession (-10%)', color: 'text-red-500' },
  { id: 'crash', label: 'Marktcrash (-30%)', color: 'text-red-700' }
];

export default function ScenarioPlanner({ portfolioId, userId }) {
  const [selectedScenario, setSelectedScenario] = useState('bull_market');
  const [timeHorizon, setTimeHorizon] = useState(12);

  const { data: simulations = [] } = useQuery({
    queryKey: ['scenarios', portfolioId],
    queryFn: async () => {
      return await base44.entities.ScenarioSimulation.filter({
        portfolio_id: portfolioId
      }, '-created_at', 10) || [];
    }
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('runScenarioSimulation', {
        portfolioId,
        userId,
        scenarioType: selectedScenario,
        timeHorizon
      });
    }
  });

  const template = scenarioTemplates.find(s => s.id === selectedScenario);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Szenario-Simulator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Markt-Szenario</Label>
            <Select value={selectedScenario} onValueChange={setSelectedScenario}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scenarioTemplates.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Zeithorizont: {timeHorizon} Monate</Label>
            <input 
              type="range" 
              min={1} 
              max={60} 
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(Number(e.target.value))}
              className="w-full mt-2"
            />
          </div>

          <Button 
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            className="w-full gap-2"
          >
            <Play className="w-4 h-4" />
            {runMutation.isPending ? 'Simuliere...' : 'Simulation starten'}
          </Button>
        </CardContent>
      </Card>

      {simulations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Jüngste Simulationen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {simulations.map(sim => (
                <div key={sim.id} className="p-3 bg-slate-50 rounded text-sm">
                  <div className="font-medium">{sim.scenario_name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {sim.time_horizon} Monate • {sim.iterations} Iterationen
                  </div>
                  {sim.results && (
                    <div className="text-xs text-slate-600 mt-2">
                      Median: {sim.results.median?.toFixed(0)}€ • VaR: {sim.results.var?.toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}