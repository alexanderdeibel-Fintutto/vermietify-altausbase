import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const benchmarks = [
  { id: 'dax', name: 'DAX', color: '#3b82f6' },
  { id: 'msci_world', name: 'MSCI World', color: '#8b5cf6' },
  { id: 'custom', name: 'Custom', color: '#10b981' }
];

export default function BenchmarkComparison({ portfolioId }) {
  const { data: benchmarkData = [] } = useQuery({
    queryKey: ['benchmarks', portfolioId],
    queryFn: async () => {
      return await base44.entities.PortfolioBenchmark.filter({
        portfolio_id: portfolioId,
        is_active: true
      }) || [];
    }
  });

  const { data: performanceHistory = [] } = useQuery({
    queryKey: ['performanceHistory', portfolioId],
    queryFn: async () => {
      return await base44.entities.AssetPerformanceHistory.filter({
        asset_id: portfolioId
      }, 'date', 50) || [];
    }
  });

  if (benchmarkData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-500">Keine Benchmarks definiert</p>
        </CardContent>
      </Card>
    );
  }

  const comparisonData = benchmarkData.map(b => ({
    name: b.benchmark_name,
    portfolio: b.portfolio_return,
    benchmark: b.benchmark_return,
    outperformance: b.outperformance
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance vs. Benchmark</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value?.toFixed(2)}%`} />
              <Legend />
              <Bar dataKey="portfolio" fill="#3b82f6" name="Portfolio" />
              <Bar dataKey="benchmark" fill="#94a3b8" name="Benchmark" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {benchmarkData.map(b => (
          <Card key={b.id}>
            <CardContent className="pt-6">
              <h4 className="font-medium mb-4">{b.benchmark_name}</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Portfolio-Rendite</span>
                  <span className={`font-medium ${b.portfolio_return > b.benchmark_return ? 'text-green-600' : 'text-red-600'}`}>
                    {b.portfolio_return?.toFixed(2)}%
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Benchmark-Rendite</span>
                  <span className="font-medium">{b.benchmark_return?.toFixed(2)}%</span>
                </div>

                <div className="border-t pt-3 flex justify-between">
                  <span className="text-sm font-medium">Überrendite</span>
                  <span className={`font-bold ${b.outperformance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {b.outperformance > 0 ? '+' : ''}{b.outperformance?.toFixed(2)}%
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Sharpe Ratio</span>
                  <span className="text-sm">
                    {b.sharpe_ratio_portfolio?.toFixed(2)} vs {b.sharpe_ratio_benchmark?.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Korrelation</span>
                  <span className="text-sm">{b.correlation?.toFixed(3)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}