import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Lightbulb, TrendingUp } from 'lucide-react';

export default function PortfolioOptimizer({ portfolioId }) {
  const [riskTolerance, setRiskTolerance] = useState(5);

  const { data: portfolio = [] } = useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: () => base44.entities.AssetPortfolio.filter({ id: portfolioId }) || []
  });

  const { data: optimizationResults, isLoading } = useQuery({
    queryKey: ['optimization', portfolioId, riskTolerance],
    queryFn: async () => {
      const result = await base44.functions.invoke('optimizePortfolio', {
        portfolioId,
        riskTolerance
      });
      return result.data;
    }
  });

  if (!optimizationResults) {
    return <div className="p-6 text-sm text-slate-500">Optimiere...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Portfolio-Optimierer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Risikotoleranz: {riskTolerance}/10</Label>
            <Slider
              value={[riskTolerance]}
              onValueChange={(val) => setRiskTolerance(val[0])}
              min={1}
              max={10}
              step={1}
              className="mt-2"
            />
            <p className="text-xs text-slate-500 mt-2">
              {riskTolerance <= 3 && 'Konservativ'}
              {riskTolerance > 3 && riskTolerance <= 6 && 'Moderat'}
              {riskTolerance > 6 && 'Aggressiv'}
            </p>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={optimizationResults.projected_growth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="current" stroke="#3b82f6" name="Aktuell" />
              <Line type="monotone" dataKey="optimized" stroke="#10b981" name="Optimiert" />
            </LineChart>
          </ResponsiveContainer>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs text-slate-600">Erwartete Rendite (Aktuell)</p>
              <p className="text-lg font-bold">{optimizationResults.current_return?.toFixed(2)}%</p>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <p className="text-xs text-slate-600">Erwartete Rendite (Optimiert)</p>
              <p className="text-lg font-bold text-green-600">{optimizationResults.optimized_return?.toFixed(2)}%</p>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs text-slate-600">Volatilität (Aktuell)</p>
              <p className="text-lg font-bold">{optimizationResults.current_volatility?.toFixed(2)}%</p>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <p className="text-xs text-slate-600">Volatilität (Optimiert)</p>
              <p className="text-lg font-bold text-green-600">{optimizationResults.optimized_volatility?.toFixed(2)}%</p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Empfohlene Änderungen
            </p>
            <div className="space-y-2 mt-2 text-sm">
              {optimizationResults.recommendations?.map((rec, idx) => (
                <div key={idx} className="text-blue-800">
                  • {rec}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}