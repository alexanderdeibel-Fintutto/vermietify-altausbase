import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Banknote, Target, AlertCircle } from 'lucide-react';

// Fallback asset categories constant for when import might fail
const ASSET_CATEGORIES_FALLBACK = {};

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <Card key={idx} className={`p-4 lg:p-6 ${kpi.bgColor}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-light text-slate-600 uppercase tracking-wider line-clamp-1">
                  {kpi.label}
                </p>
                <p className={`text-lg lg:text-2xl font-light mt-1 lg:mt-2 break-words ${kpi.color}`}>
                  {kpi.value}
                </p>
              </div>
              <Icon className={`w-6 lg:w-8 h-6 lg:h-8 ${kpi.color} opacity-20 flex-shrink-0`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}