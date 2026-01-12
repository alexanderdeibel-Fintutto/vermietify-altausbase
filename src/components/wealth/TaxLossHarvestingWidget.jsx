import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingDown } from 'lucide-react';

export default function TaxLossHarvestingWidget({ assets = [], transactions = [] }) {
  const harvestingOpportunities = useMemo(() => {
    const opportunities = [];

    assets.forEach(asset => {
      const currentValue = asset.current_value || 0;
      const invested = (asset.purchase_price_avg || 0) * asset.quantity;
      const loss = invested - currentValue;

      if (loss > 0) {
        opportunities.push({
          assetId: asset.id,
          name: asset.name,
          unrealizedLoss: loss,
          lossPercent: (loss / invested) * 100,
          invested,
          currentValue
        });
      }
    });

    return opportunities.sort((a, b) => b.unrealizedLoss - a.unrealizedLoss);
  }, [assets]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-500" />
          Tax Loss Harvesting Chancen
        </CardTitle>
      </CardHeader>
      <CardContent>
        {harvestingOpportunities.length === 0 ? (
          <p className="text-slate-500 text-sm">Keine Verluste verfügbar</p>
        ) : (
          <div className="space-y-3">
            {harvestingOpportunities.map((opp) => (
              <div key={opp.assetId} className="p-3 bg-red-50 rounded border border-red-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{opp.name}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Investiert: €{opp.invested.toFixed(2)} → Aktuell: €{opp.currentValue.toFixed(2)}
                    </p>
                  </div>
                  <Badge className="bg-red-100 text-red-700">
                    -€{opp.unrealizedLoss.toFixed(2)}
                  </Badge>
                </div>
              </div>
            ))}
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-700 flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Durch Verkauf und Wiederanlage können Sie Steuerliche Verluste realisieren
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}