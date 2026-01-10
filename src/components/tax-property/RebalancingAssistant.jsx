import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Scale, ArrowRight } from 'lucide-react';

export default function RebalancingAssistant() {
  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.AssetPortfolio.list(null, 100)
  });

  const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);

  const allocation = {
    stocks: assets.filter(a => a.asset_type === 'stock').reduce((sum, a) => sum + (a.current_value || 0), 0),
    bonds: assets.filter(a => a.asset_type === 'bond').reduce((sum, a) => sum + (a.current_value || 0), 0),
    real_estate: assets.filter(a => a.asset_type === 'real_estate').reduce((sum, a) => sum + (a.current_value || 0), 0)
  };

  const target = { stocks: 60, bonds: 30, real_estate: 10 };
  
  const current = {
    stocks: (allocation.stocks / totalValue) * 100,
    bonds: (allocation.bonds / totalValue) * 100,
    real_estate: (allocation.real_estate / totalValue) * 100
  };

  const rebalanceNeeded = Object.keys(target).some(key => 
    Math.abs(current[key] - target[key]) > 5
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Rebalancing
          </CardTitle>
          {rebalanceNeeded && <Badge className="bg-orange-600">Action needed</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.keys(target).map(key => (
          <div key={key}>
            <div className="flex justify-between mb-1 text-sm">
              <span className="font-semibold capitalize">{key.replace('_', ' ')}</span>
              <span>{current[key].toFixed(1)}% / {target[key]}%</span>
            </div>
            <Progress value={current[key]} className={
              Math.abs(current[key] - target[key]) > 5 ? 'bg-orange-200' : 'bg-green-200'
            } />
            {Math.abs(current[key] - target[key]) > 5 && (
              <p className="text-xs text-orange-600 mt-1">
                <ArrowRight className="w-3 h-3 inline mr-1" />
                {current[key] > target[key] ? 'Reduzieren' : 'Erhöhen'} um {Math.abs(current[key] - target[key]).toFixed(1)}%
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}