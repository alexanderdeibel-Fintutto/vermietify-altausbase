import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Coins, Package } from 'lucide-react';

export default function PortfolioKPICards({ portfolio = [] }) {
  const calculateMetrics = () => {
    const totalValue = portfolio.reduce((sum, asset) => sum + (asset.quantity * asset.current_value), 0);
    const totalInvested = portfolio.reduce((sum, asset) => sum + (asset.quantity * asset.purchase_price), 0);
    const totalGain = totalValue - totalInvested;
    const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    return {
      totalValue,
      totalInvested,
      totalGain,
      totalGainPercent,
      positionCount: portfolio.length
    };
  };

  const metrics = calculateMetrics();

  const formatCurrency = (value, decimals = 0) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: decimals
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-light text-slate-600">Gesamtwert Portfolio</div>
          <div className="text-2xl font-light text-slate-900 mt-2">{formatCurrency(metrics.totalValue)}</div>
          <div className="text-xs text-slate-500 mt-1">€ {metrics.totalInvested.toLocaleString('de-DE')} investiert</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-light text-slate-600">Gewinn/Verlust</div>
          <div className={`text-2xl font-light mt-2 ${metrics.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.totalGain >= 0 ? '+' : ''}{formatCurrency(metrics.totalGain)}
          </div>
          <div className={`text-xs mt-1 ${metrics.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.totalGainPercent >= 0 ? '+' : ''}{metrics.totalGainPercent.toFixed(2)}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-light text-slate-600">Anzahl Positionen</div>
          <div className="text-2xl font-light text-slate-900 mt-2">{metrics.positionCount}</div>
          <div className="text-xs text-slate-500 mt-1">
            {new Set(portfolio.map(a => a.asset_category)).size} Kategorien
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-light text-slate-600">YTD Rendite</div>
          <div className="text-2xl font-light text-slate-900 mt-2">{metrics.totalGainPercent.toFixed(2)}%</div>
          <div className="text-xs text-slate-500 mt-1">Dieses Jahr</div>
        </CardContent>
      </Card>
    </div>
  );
}