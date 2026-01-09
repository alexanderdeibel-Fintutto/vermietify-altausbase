import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MobilePortfolioCard({ asset }) {
  const totalValue = asset.quantity * asset.current_value;
  const totalInvested = asset.quantity * asset.purchase_price;
  const gain = totalValue - totalInvested;
  const gainPercent = (gain / totalInvested) * 100;

  return (
    <Card className="p-4 mb-3 md:mb-0">
      <CardContent className="p-0 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-slate-900 truncate">{asset.name}</h3>
            <p className="text-xs text-slate-500 mt-1">{asset.isin}</p>
          </div>
          <Badge variant="outline" className="text-xs ml-2">{asset.asset_category}</Badge>
        </div>

        {/* Zahlen */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-slate-500">Menge</p>
            <p className="font-medium text-slate-900">{asset.quantity.toLocaleString('de-DE')}</p>
          </div>
          <div>
            <p className="text-slate-500">Kurs</p>
            <p className="font-medium text-slate-900">{asset.current_value.toFixed(2)}€</p>
          </div>
          <div>
            <p className="text-slate-500">Wert</p>
            <p className="font-medium text-slate-900">{(totalValue / 1000).toFixed(1)}k€</p>
          </div>
          <div>
            <p className="text-slate-500">Gewinn/Verlust</p>
            <p className={`font-medium flex items-center gap-1 ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {gain >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {gainPercent.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}