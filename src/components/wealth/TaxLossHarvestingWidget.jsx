import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingDown, Zap } from 'lucide-react';

export default function TaxLossHarvestingWidget() {
  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list(),
  });

  const [harvestingSuggestions, setHarvestingSuggestions] = useState([]);

  // Berechne Tax-Loss-Harvesting Opportunities
  React.useEffect(() => {
    const suggestions = assets
      .map(asset => {
        const costBasis = asset.purchase_price_avg * asset.quantity;
        const currentValue = asset.current_value || 0;
        const unrealizedLoss = currentValue - costBasis;

        if (unrealizedLoss < -100) { // Mind. 100 EUR Verlust
          return {
            ...asset,
            unrealizedLoss,
            potentialTaxSavings: Math.abs(unrealizedLoss) * 0.25, // 25% KapErtSt
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b.potentialTaxSavings - a.potentialTaxSavings);

    setHarvestingSuggestions(suggestions);
  }, [assets]);

  const totalPotentialSavings = harvestingSuggestions.reduce((sum, s) => sum + s.potentialTaxSavings, 0);

  if (harvestingSuggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Tax-Loss-Harvesting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Keine Harvesting-Gelegenheiten. Dein Portfolio läuft gut! 🎉</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <TrendingDown className="w-5 h-5" />
          Tax-Loss-Harvesting Gelegenheiten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white p-3 rounded border border-amber-200">
          <p className="text-xs text-amber-700">
            <strong>Potenzielle Steuersparen:</strong> {totalPotentialSavings.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {harvestingSuggestions.map(suggestion => (
            <div key={suggestion.id} className="bg-white p-3 rounded border border-amber-200">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{suggestion.name}</p>
                  <p className="text-xs text-slate-600">{suggestion.symbol}</p>
                </div>
                <Badge className="bg-red-100 text-red-800 whitespace-nowrap">
                  {Math.abs(suggestion.unrealizedLoss).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </Badge>
              </div>
              <p className="text-xs text-amber-700 mb-2">
                💰 Steuersparen: {suggestion.potentialTaxSavings.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
              <Button size="sm" variant="outline" className="w-full text-xs">
                Verkaufen & Umschichten
              </Button>
            </div>
          ))}
        </div>

        <div className="bg-white p-3 rounded border border-amber-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>Wichtig:</strong> Beachte die Wash-Sale-Regel! Ein Rückkauf desselben/ähnlichen Assets innerhalb von 30 Tagen vor/nach dem Verkauf kann zu Steuer-Nachzahlungen führen.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}