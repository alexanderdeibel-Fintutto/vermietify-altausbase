import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Lightbulb } from 'lucide-react';

export default function PortfolioSimulationPanel({ userId, totalValue }) {
  const [months, setMonths] = useState(12);
  const [annualReturn, setAnnualReturn] = useState(8);
  const [volatility, setVolatility] = useState(15);

  const simulationMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('portfolioSimulation', {
        user_id: userId,
        scenario_type: 'monte_carlo',
        parameters: { months: parseInt(months), annual_return: annualReturn / 100, volatility: volatility / 100 }
      });
    }
  });

  const data = simulationMutation.data?.simulations?.[0]?.path || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Portfolio-Simulation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
          <div>
            <Label className="text-sm">Zeitraum (Monate)</Label>
            <Input
              type="number"
              min="1"
              max="60"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Jährliche Rendite (%)</Label>
            <Input
              type="number"
              min="0"
              max="50"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Volatilität (%)</Label>
            <Input
              type="number"
              min="0"
              max="50"
              value={volatility}
              onChange={(e) => setVolatility(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <Button
          onClick={() => simulationMutation.mutate()}
          disabled={simulationMutation.isPending}
          className="w-full bg-slate-900 hover:bg-slate-800"
        >
          {simulationMutation.isPending ? 'Simuliere...' : 'Simulation starten'}
        </Button>

        {data.length > 0 && (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `€${value.toFixed(0)}`} />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {simulationMutation.data.simulations.map((sim, idx) => (
                <Card key={idx} className="p-4">
                  <p className="text-sm font-light text-slate-600">{sim.scenario}</p>
                  <p className="text-lg font-medium text-slate-900 mt-2">
                    {(sim.final_value / 1000).toFixed(1)}k€
                  </p>
                  <p className={`text-sm mt-1 ${sim.gain_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {sim.gain_percent > 0 ? '+' : ''}{sim.gain_percent.toFixed(1)}%
                  </p>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}