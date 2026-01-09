import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, Download } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
};

export default function MobilePortfolioDashboard({ portfolio, onExport }) {
  const [expanded, setExpanded] = useState(null);

  const stats = {
    total: portfolio.reduce((s, p) => s + (p.quantity * p.current_value), 0),
    invested: portfolio.reduce((s, p) => s + (p.quantity * p.purchase_price), 0),
    count: portfolio.length
  };

  stats.gain = stats.total - stats.invested;
  stats.gainPercent = (stats.gain / stats.invested) * 100;

  return (
    <div className="space-y-4">
      {/* KPI Cards - Stacked on Mobile */}
      <div className="space-y-2">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-700">
          <CardContent className="p-4 text-white">
            <p className="text-xs opacity-90 mb-1">Gesamtwert</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
            <p className={`text-sm mt-2 ${stats.gainPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.gainPercent >= 0 ? '+' : ''}{stats.gainPercent.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-slate-600">Investiert</p>
              <p className="font-bold text-sm mt-1">{formatCurrency(stats.invested)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-slate-600">Positionen</p>
              <p className="font-bold text-sm mt-1">{stats.count}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1">
          <Filter className="w-4 h-4" /> Filter
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={onExport}>
          <Download className="w-4 h-4" /> Export
        </Button>
      </div>

      {/* Portfolio Items - Touch-optimiert */}
      <div className="space-y-2">
        {portfolio.slice(0, 10).map((item) => {
          const pValue = item.quantity * item.current_value;
          const pGain = pValue - (item.quantity * item.purchase_price);
          const pGainPercent = (pGain / (item.quantity * item.purchase_price)) * 100;
          const isExpanded = expanded === item.id;

          return (
            <Card key={item.id} className="cursor-pointer" onClick={() => setExpanded(isExpanded ? null : item.id)}>
              <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                    <p className="text-xs text-slate-600">{item.asset_category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(pValue)}</p>
                    <p className={`text-xs ${pGainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pGainPercent >= 0 ? '+' : ''}{pGainPercent.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-2 border-t space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Anzahl:</span>
                      <span>{item.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Kurs:</span>
                      <span>{formatCurrency(item.current_value)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Gewinn/Verlust:</span>
                      <span className={pGainPercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(pGain)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {portfolio.length > 10 && (
        <Button variant="outline" className="w-full">
          Alle {portfolio.length} Positionen anzeigen
        </Button>
      )}
    </div>
  );
}