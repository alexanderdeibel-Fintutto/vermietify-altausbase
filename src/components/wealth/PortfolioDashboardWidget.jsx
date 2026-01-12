import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function PortfolioDashboardWidget() {
  const { data: holdings = [] } = useQuery({
    queryKey: ['all-holdings'],
    queryFn: () => base44.entities.AssetHolding.list()
  });

  const totalValue = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);
  const totalCost = holdings.reduce((sum, h) => sum + (h.total_cost_basis || 0), 0);
  const totalGL = totalValue - totalCost;
  const totalGLPercent = totalCost > 0 ? (totalGL / totalCost) * 100 : 0;

  const isPositive = totalGL >= 0;

  return (
    <Card className={`border-2 ${isPositive ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">Portfolio-Wert</span>
          {isPositive ? (
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-600" />
          )}
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">
          {new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
          }).format(totalValue)}
        </div>
        <div className={`text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
          }).format(totalGL)} ({totalGLPercent.toFixed(2)}%)
        </div>
      </CardContent>
    </Card>
  );
}