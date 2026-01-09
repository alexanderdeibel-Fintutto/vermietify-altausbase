import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function RebalancingAdvisor({ portfolioId, userId }) {
  const queryClient = useQueryClient();
  const [showActions, setShowActions] = useState(false);

  const { data: strategy } = useQuery({
    queryKey: ['rebalancingStrategy', portfolioId],
    queryFn: async () => {
      const result = await base44.entities.RebalancingStrategy.filter({
        portfolio_id: portfolioId,
        is_active: true
      });
      return result?.[0];
    }
  });

  const { data: rebalancingPlan } = useQuery({
    queryKey: ['rebalancingPlan', portfolioId],
    queryFn: async () => {
      if (!strategy) return null;
      const result = await base44.functions.invoke('calculateRebalancing', {
        portfolioId,
        strategyId: strategy.id
      });
      return result.data;
    },
    enabled: !!strategy
  });

  const executeMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('executeRebalancing', {
        portfolioId,
        strategyId: strategy.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rebalancingPlan'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    }
  });

  if (!strategy) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-500">Keine Rebalancing-Strategie konfiguriert</p>
        </CardContent>
      </Card>
    );
  }

  if (!rebalancingPlan) {
    return <div>Lädt...</div>;
  }

  const needsRebalancing = rebalancingPlan.actions.some(a => Math.abs(a.deviation) > strategy.deviation_threshold);

  return (
    <div className="space-y-4">
      <Card className={needsRebalancing ? 'border-orange-200 bg-orange-50' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{strategy.name}</CardTitle>
            {needsRebalancing && <AlertCircle className="w-5 h-5 text-orange-600" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {needsRebalancing && (
            <div className="p-3 bg-orange-100 rounded text-sm text-orange-800">
              Rebalancing erforderlich - Abweichung überschreitet {strategy.deviation_threshold}%
            </div>
          )}

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rebalancingPlan.allocation_comparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => `${value?.toFixed(1)}%`} />
              <Legend />
              <Bar dataKey="current" fill="#3b82f6" name="Aktuell" />
              <Bar dataKey="target" fill="#10b981" name="Ziel" />
            </BarChart>
          </ResponsiveContainer>

          <div className="space-y-2">
            {rebalancingPlan.actions.map((action, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded text-sm">
                <div>
                  <div className="font-medium">{action.asset_name}</div>
                  <div className="text-xs text-slate-500">
                    {action.action}: {Math.abs(action.amount).toFixed(0)} €
                  </div>
                </div>
                <div className={`font-medium ${action.action === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                  {action.action === 'BUY' ? '+' : '-'}{Math.abs(action.deviation).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>

          {needsRebalancing && (
            <Button
              onClick={() => executeMutation.mutate()}
              disabled={executeMutation.isPending}
              className="w-full gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {executeMutation.isPending ? 'Wird ausgeführt...' : 'Rebalancing durchführen'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}