import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Banknote, Target, AlertCircle } from 'lucide-react';

export default function PortfolioKPICards({ portfolio = [] }) {
  const totalValue = portfolio.reduce((sum, asset) => {
    return sum + (asset.quantity * asset.current_value);
  }, 0);

  const totalInvested = portfolio.reduce((sum, asset) => {
    return sum + (asset.quantity * asset.purchase_price);
  }, 0);

  const totalGain = totalValue - totalInvested;
  const gainPercent = totalInvested > 0 ? (totalGain / totalInvested * 100) : 0;

  const kpis = [
    {
      label: 'Gesamtwert Portfolio',
      value: `€${totalValue.toLocaleString('de-DE', { maximumFractionDigits: 0 })}`,
      icon: Banknote,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Gewinn/Verlust',
      value: `€${totalGain.toLocaleString('de-DE', { maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      color: gainPercent >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: gainPercent >= 0 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      label: 'Rendite',
      value: `${gainPercent.toFixed(2)}%`,
      icon: Target,
      color: gainPercent >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: gainPercent >= 0 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      label: 'Positionen',
      value: portfolio.length,
      icon: AlertCircle,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <Card key={idx} className={`p-6 ${kpi.bgColor}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-light text-slate-600 uppercase tracking-wider">{kpi.label}</p>
                <p className={`text-2xl font-light mt-2 ${kpi.color}`}>
                  {kpi.value}
                </p>
              </div>
              <Icon className={`w-8 h-8 ${kpi.color} opacity-20`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}