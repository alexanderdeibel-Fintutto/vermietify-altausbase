import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scale, ArrowRight } from 'lucide-react';

export default function RebalancingAdvisor({ portfolio, holdings = [], assets = [] }) {
  if (!portfolio?.target_allocation) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          <p>Definieren Sie zuerst eine Ziel-Allokation für Ihr Portfolio</p>
        </CardContent>
      </Card>
    );
  }

  const calculateCurrentAllocation = () => {
    const allocation = {};
    const total = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);

    holdings.forEach(holding => {
      const asset = assets.find(a => a.id === holding.asset_id);
      if (!asset) return;

      const className = asset.asset_class;
      if (!allocation[className]) {
        allocation[className] = 0;
      }
      allocation[className] += holding.current_value || 0;
    });

    Object.keys(allocation).forEach(key => {
      allocation[key] = total > 0 ? (allocation[key] / total) * 100 : 0;
    });

    return allocation;
  };

  const currentAllocation = calculateCurrentAllocation();
  const targetAllocation = portfolio.target_allocation;

  const suggestions = [];
  Object.keys(targetAllocation).forEach(assetClass => {
    const target = targetAllocation[assetClass];
    const current = currentAllocation[assetClass] || 0;
    const diff = current - target;

    if (Math.abs(diff) > 5) { // Mehr als 5% Abweichung
      suggestions.push({
        assetClass,
        target,
        current,
        diff,
        action: diff > 0 ? 'Verkaufen' : 'Kaufen'
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="w-5 h-5 text-slate-600" />
          Rebalancing-Empfehlungen
        </CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <p className="text-sm text-slate-500">Portfolio ist gut ausbalanciert</p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((sug, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-900">{sug.assetClass}</span>
                  <span className={`text-sm font-semibold ${
                    sug.diff > 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                    {sug.diff > 0 ? '+' : ''}{sug.diff.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>{sug.current.toFixed(1)}%</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>{sug.target.toFixed(1)}%</span>
                  <span className="ml-auto font-medium">{sug.action}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}