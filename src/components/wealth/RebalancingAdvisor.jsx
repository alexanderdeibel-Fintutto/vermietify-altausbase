import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, TrendingUp, AlertCircle } from 'lucide-react';

export default function RebalancingAdvisor() {
  const [targetAllocation, setTargetAllocation] = useState({
    STOCK: 40,
    ETF: 40,
    CRYPTO: 15,
    GOLD: 5,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list(),
  });

  // Berechne aktuelle Allokation
  const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const currentAllocation = {};

  Object.keys(targetAllocation).forEach(assetClass => {
    const classAssets = assets.filter(a => a.asset_class === assetClass);
    const classValue = classAssets.reduce((sum, a) => sum + (a.current_value || 0), 0);
    currentAllocation[assetClass] = totalValue > 0 ? (classValue / totalValue) * 100 : 0;
  });

  // Berechne Rebalancing-Vorschläge
  const rebalancingSuggestions = Object.keys(targetAllocation).map(assetClass => {
    const current = currentAllocation[assetClass] || 0;
    const target = targetAllocation[assetClass];
    const difference = target - current;
    const amount = (difference / 100) * totalValue;

    return {
      assetClass,
      current,
      target,
      difference,
      amount,
      action: amount > 0 ? 'BUY' : 'SELL',
    };
  });

  // Sortiere nach Abweichung
  const sortedSuggestions = rebalancingSuggestions.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  const needsRebalancing = sortedSuggestions.some(s => Math.abs(s.difference) > 5);

  return (
    <Card className={needsRebalancing ? 'border-amber-200 bg-amber-50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Umschichtungs-Empfehlungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!needsRebalancing && (
          <Alert className="bg-green-50 border-green-200">
            <AlertCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Dein Portfolio ist gut ausbalanciert. Keine Umschichtung nötig.
            </AlertDescription>
          </Alert>
        )}

        {needsRebalancing && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Dein Portfolio weicht von der Zielallokation ab. Folgende Umschichtungen werden empfohlen.
            </AlertDescription>
          </Alert>
        )}

        {/* Current vs Target Comparison */}
        <div className="space-y-3">
          {sortedSuggestions.map(suggestion => (
            <div key={suggestion.assetClass} className="p-3 bg-white rounded border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{suggestion.assetClass}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Aktuell: {suggestion.current.toFixed(1)}% | Ziel: {suggestion.target.toFixed(1)}%
                  </p>
                </div>
                <Badge
                  className={
                    suggestion.action === 'BUY'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }
                >
                  {suggestion.action === 'BUY' ? '+' : '-'}
                  {Math.abs(suggestion.amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${suggestion.current > suggestion.target ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(suggestion.current, 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs font-semibold text-slate-700 w-12 text-right">
                  {suggestion.current.toFixed(1)}%
                </span>
              </div>

              {/* Deviation */}
              {Math.abs(suggestion.difference) > 0.1 && (
                <p className={`text-xs mt-2 font-semibold ${suggestion.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {suggestion.difference > 0 ? '↑' : '↓'} {Math.abs(suggestion.difference).toFixed(1)}% Abweichung
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Action Button */}
        {needsRebalancing && (
          <Button className="w-full gap-2">
            <ArrowRight className="w-4 h-4" />
            Umschichtung durchführen
          </Button>
        )}

        {/* Info */}
        <div className="bg-blue-50 p-3 rounded border border-blue-200 text-xs text-blue-800">
          <p className="font-semibold mb-1">💡 Tipp:</p>
          <p>
            Eine Umschichtung ist sinnvoll, wenn die Abweichung größer als 5% ist. Beachte dabei Steuern auf
            Kapitalgewinne!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}