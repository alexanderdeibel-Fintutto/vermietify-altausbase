import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function PerformanceMetricsCard({ portfolioId }) {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);

  const calculateMetrics = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('calculatePortfolioPerformance', { portfolioId });
      setMetrics(result.data.performance);
      toast.success('Performance berechnet');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-600" />
          Performance-Metriken
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!metrics ? (
          <Button
            onClick={calculateMetrics}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {loading ? 'Berechne...' : 'Performance berechnen'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Total Return</span>
              <span className={`font-semibold ${
                metrics.total_return >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {metrics.total_return >= 0 ? '+' : ''}{metrics.total_return.toFixed(2)}%
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">TWR (Time-Weighted)</span>
              <span className="font-semibold text-slate-900">
                {metrics.twr.toFixed(2)}%
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">MWR (Money-Weighted)</span>
              <span className="font-semibold text-slate-900">
                {metrics.mwr.toFixed(2)}%
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Volatilität (p.a.)</span>
              <span className="font-semibold text-slate-900">
                {metrics.volatility.toFixed(2)}%
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Sharpe Ratio</span>
              <span className="font-semibold text-slate-900">
                {metrics.sharpe_ratio.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-600">Max Drawdown</span>
              <span className="font-semibold text-red-600">
                -{metrics.max_drawdown.toFixed(2)}%
              </span>
            </div>

            <Button onClick={calculateMetrics} variant="outline" size="sm" className="w-full mt-2">
              Aktualisieren
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}