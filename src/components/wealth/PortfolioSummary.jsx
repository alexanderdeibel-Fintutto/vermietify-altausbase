import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function PortfolioSummary({ assets = [] }) {
  const summary = useMemo(() => {
    const total = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
    const invested = assets.reduce((sum, a) => sum + (a.purchase_price_avg * a.quantity || 0), 0);
    const gain = total - invested;
    const gainPercent = invested > 0 ? (gain / invested) * 100 : 0;

    const byClass = {};
    assets.forEach(a => {
      if (!byClass[a.asset_class]) byClass[a.asset_class] = 0;
      byClass[a.asset_class] += a.current_value || 0;
    });

    return { total, invested, gain, gainPercent, byClass };
  }, [assets]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-600">Portfolio-Wert</p>
          <p className="text-2xl font-bold mt-2">€{summary.total.toLocaleString('de-DE', {maximumFractionDigits: 2})}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-600">Investiert</p>
          <p className="text-2xl font-bold mt-2">€{summary.invested.toLocaleString('de-DE', {maximumFractionDigits: 2})}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-600">Gewinn/Verlust</p>
          <div className="flex items-center gap-2 mt-2">
            {summary.gain >= 0 ? (
              <TrendingUp className="text-emerald-600" />
            ) : (
              <TrendingDown className="text-red-600" />
            )}
            <p className={`text-2xl font-bold ${summary.gain >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              €{summary.gain.toLocaleString('de-DE', {maximumFractionDigits: 2})}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-600">Rendite</p>
          <p className={`text-2xl font-bold mt-2 ${summary.gainPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {summary.gainPercent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}