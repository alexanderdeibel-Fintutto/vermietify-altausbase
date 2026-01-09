import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart3, AlertTriangle } from 'lucide-react';

export default function PortfolioRebalancingPanel({ portfolio, userId }) {
  const [showTargets, setShowTargets] = useState(false);
  const [targets, setTargets] = useState({
    stocks: 40,
    bonds: 30,
    crypto: 10,
    cash: 20
  });

  const queryClient = useQueryClient();

  const rebalanceMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('portfolioRebalancingEngine', {
        user_id: userId,
        target_allocation: targets
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolioAlerts'] });
    }
  });

  // Calculate current allocation
  const totalValue = portfolio.reduce((sum, a) => sum + (a.quantity * a.current_value), 0);
  const allocation = {};

  for (const asset of portfolio) {
    const cat = asset.asset_category;
    if (!allocation[cat]) allocation[cat] = 0;
    allocation[cat] += (asset.quantity * asset.current_value) / totalValue * 100;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Portfolio-Rebalancing
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowTargets(!showTargets)}
          >
            {showTargets ? 'Verbergen' : 'Ziele festlegen'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showTargets && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg">
            {Object.entries(targets).map(([cat, target]) => (
              <div key={cat}>
                <label className="text-xs text-slate-600 capitalize">{cat}</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={target}
                  onChange={(e) => setTargets({ ...targets, [cat]: parseInt(e.target.value) })}
                  className="mt-1 text-sm"
                />
              </div>
            ))}
          </div>
        )}

        {/* Current vs Target */}
        <div className="space-y-2">
          {Object.entries(targets).map(([cat, target]) => {
            const current = allocation[cat] || 0;
            const diff = current - target;

            return (
              <div key={cat} className="flex items-center justify-between text-sm">
                <div className="capitalize flex-1">
                  <span className="font-medium">{cat}</span>
                  <div className="w-full bg-slate-100 rounded h-2 mt-1">
                    <div
                      className="bg-blue-500 h-full rounded"
                      style={{ width: `${Math.min(current, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className="text-slate-900">{current.toFixed(1)}%</p>
                  <p className={`text-xs ${diff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rebalancing Suggestions */}
        {rebalanceMutation.data && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle>Rebalancing-Empfehlung</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2 text-sm">
                {rebalanceMutation.data.suggestions?.map((s, idx) => (
                  <div key={idx}>
                    {s.action} {(s.amount / 1000).toFixed(1)}k€ in {s.category}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={() => rebalanceMutation.mutate()}
          disabled={rebalanceMutation.isPending}
          className="w-full bg-slate-900 hover:bg-slate-800"
        >
          {rebalanceMutation.isPending ? 'Berechne...' : 'Rebalancing-Plan erstellen'}
        </Button>
      </CardContent>
    </Card>
  );
}