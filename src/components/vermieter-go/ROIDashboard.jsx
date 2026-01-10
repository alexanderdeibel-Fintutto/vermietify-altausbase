import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign } from 'lucide-react';

export default function ROIDashboard({ buildingId }) {
  const metrics = {
    totalInvestment: 250000,
    annualRent: 24000,
    annualCosts: 8000,
    netIncome: 16000,
    roi: 6.4,
    cashOnCash: 8.2
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          ROI-Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-900">ROI</p>
            <p className="text-2xl font-bold text-blue-900">{metrics.roi}%</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-900">Cash-on-Cash</p>
            <p className="text-2xl font-bold text-green-900">{metrics.cashOnCash}%</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Jahresmiete:</span>
            <span className="font-semibold">{metrics.annualRent.toLocaleString('de-DE')}€</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Kosten:</span>
            <span className="font-semibold text-red-600">-{metrics.annualCosts.toLocaleString('de-DE')}€</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-semibold">Nettoertrag:</span>
            <span className="font-bold text-green-600">{metrics.netIncome.toLocaleString('de-DE')}€</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}