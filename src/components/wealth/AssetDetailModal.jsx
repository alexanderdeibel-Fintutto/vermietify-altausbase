import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Edit2, Trash2, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Mock-Daten für Performance-Chart
const generateMockPerformanceData = (asset) => {
  const data = [];
  const monthsBack = 12;
  const basePrice = asset.purchase_price;
  
  for (let i = monthsBack; i >= 0; i--) {
    const variation = Math.sin(i / 3) * 0.15 + Math.random() * 0.05;
    data.push({
      month: format(new Date(new Date().setMonth(new Date().getMonth() - i)), 'MMM', { locale: de }),
      value: basePrice * (1 + variation),
      date: format(new Date(new Date().setMonth(new Date().getMonth() - i)), 'dd.MM.yyyy')
    });
  }
  
  return data;
};

export default function AssetDetailModal({ asset, open, onOpenChange, onEdit, onDelete }) {
  if (!asset) return null;

  const totalInvested = asset.quantity * asset.purchase_price;
  const totalValue = asset.quantity * asset.current_value;
  const gain = totalValue - totalInvested;
  const gainPercent = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;
  const performanceData = generateMockPerformanceData(asset);

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    sold: 'bg-slate-100 text-slate-800',
    transferred: 'bg-blue-100 text-blue-800'
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Aktiv',
      sold: 'Verkauft',
      transferred: 'Übertragen'
    };
    return labels[status] || status;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{asset.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {asset.isin && `ISIN: ${asset.isin}`}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => onEdit?.(asset)}
                className="text-blue-600"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => onDelete?.(asset.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs font-light text-slate-500 uppercase">Gesamtwert</p>
                <p className="text-2xl font-light text-slate-900 mt-2">
                  €{totalValue.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs font-light text-slate-500 uppercase">Gewinn/Verlust</p>
                <p className={`text-2xl font-light mt-2 ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {gain >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%
                </p>
                <p className="text-xs font-light text-slate-500 mt-1">
                  {gain >= 0 ? '+' : ''}€{gain.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-light">Wertentwicklung (12 Monate)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => `€${value.toFixed(2)}`}
                    contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-light">Positionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-light">Menge:</span>
                  <span className="font-light">{asset.quantity.toLocaleString('de-DE', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-light">Kaufpreis:</span>
                  <span className="font-light">€{asset.purchase_price.toLocaleString('de-DE', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-light">Aktuell:</span>
                  <span className="font-light">€{asset.current_value.toLocaleString('de-DE', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="text-slate-600 font-light">Investiert:</span>
                  <span className="font-light">€{totalInvested.toLocaleString('de-DE', { maximumFractionDigits: 0 })}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-light">Informationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-light">Kaufdatum:</span>
                  <span className="font-light">{format(new Date(asset.purchase_date), 'dd.MM.yyyy', { locale: de })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-light">Währung:</span>
                  <span className="font-light">{asset.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-light">Status:</span>
                  <Badge className={statusColors[asset.status]}>
                    {getStatusLabel(asset.status)}
                  </Badge>
                </div>
                {asset.import_source && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-light">Quelle:</span>
                    <span className="font-light text-xs">{asset.import_source.replace('csv_', '')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {asset.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-light">Notizen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-light text-slate-700">{asset.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-slate-200">
            <Button variant="outline" className="flex-1 font-light gap-2">
              <Download className="w-4 h-4" />
              Exportieren
            </Button>
            <Button onClick={() => onOpenChange(false)} className="flex-1 bg-slate-900 hover:bg-slate-800 font-light">
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}