import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Lightbulb } from 'lucide-react';

export default function PortfolioOptimizer() {
  const { data: analyses = [] } = useQuery({
    queryKey: ['portfolio-analyses'],
    queryFn: () => base44.entities.PortfolioAnalysis.list('-analysis_date', 50)
  });

  const latestAnalysis = analyses[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Lightbulb className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Portfolio Optimizer</h1>
          <p className="text-slate-600">Multi-Property ROI, Steueroptimierung, Rebalancing</p>
        </div>
      </div>

      {latestAnalysis && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">€{(latestAnalysis.total_portfolio_value / 1000000).toFixed(1)}M</div>
                <p className="text-sm text-slate-600">Portfolio-Wert</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600">{latestAnalysis.portfolio_roi}%</div>
                <p className="text-sm text-slate-600">ROI</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  €{(latestAnalysis.tax_optimization_potential / 1000).toFixed(0)}k
                </div>
                <p className="text-sm text-slate-600">Steuersparpotential</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{latestAnalysis.diversification_score}</div>
                <p className="text-sm text-slate-600">Diversifikation</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Rebalancing-Empfehlungen</h3>
              <div className="space-y-3">
                {JSON.parse(latestAnalysis.rebalancing_recommendations || '[]').map((rec, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="font-medium">{rec.action}</p>
                    <p className="text-sm text-slate-600">{rec.reason}</p>
                    <Progress value={rec.priority * 20} className="mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}