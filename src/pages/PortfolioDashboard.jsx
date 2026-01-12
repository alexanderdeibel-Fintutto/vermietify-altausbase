import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, Plus, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function PortfolioDashboard() {
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list()
  });

  const { data: portfolios = [] } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => base44.entities.Portfolio.list()
  });

  const { data: taxOptimization = [] } = useQuery({
    queryKey: ['taxOptimization', new Date().getFullYear()],
    queryFn: () => base44.entities.TaxOptimization.filter({ 
      tax_year: new Date().getFullYear() 
    })
  });

  // Berechne Gesamtwerte
  const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const totalCost = assets.reduce((sum, a) => sum + (a.purchase_price_avg || 0) * a.quantity, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? ((totalGainLoss / totalCost) * 100) : 0;

  // Asset-Allocation
  const allocationData = [
    { name: 'Aktien/ETFs', value: assets.filter(a => ['STOCK', 'ETF', 'MUTUAL_FUND'].includes(a.asset_class)).reduce((s, a) => s + (a.current_value || 0), 0) },
    { name: 'Krypto', value: assets.filter(a => a.asset_class === 'CRYPTO').reduce((s, a) => s + (a.current_value || 0), 0) },
    { name: 'Edelmetalle', value: assets.filter(a => ['GOLD', 'SILVER', 'PLATINUM'].includes(a.asset_class)).reduce((s, a) => s + (a.current_value || 0), 0) },
    { name: 'Sonstige', value: assets.filter(a => a.asset_class === 'OTHER').reduce((s, a) => s + (a.current_value || 0), 0) }
  ].filter(item => item.value > 0);

  // Top Holdings
  const topHoldings = [...assets]
    .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
    .slice(0, 10);

  // Freistellungsauftrag
  const fsa = taxOptimization.find(t => t.pot_type === 'FREISTELLUNGSAUFTRAG');
  const fsaUsed = fsa?.amount_used || 0;
  const fsaAvailable = (fsa?.amount_available || 1602) - fsaUsed;

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Vermögens-Dashboard</h1>
          <p className="text-slate-600 mt-1">{portfolios.length} Portfolios · {assets.length} Positionen</p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl('StocksAndETFs')}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Asset hinzufügen
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-slate-600">Gesamtvermögen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span className="text-2xl font-bold">{totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-slate-600">Gewinn/Verlust</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {totalGainLoss >= 0 ? (
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
              <span className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {totalGainLoss.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
            <p className={`text-sm mt-1 ${totalGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-slate-600">Portfolios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">{portfolios.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-slate-600">Freistellungsauftrag</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <span className="text-2xl font-bold">{fsaAvailable.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
              <p className="text-xs text-slate-600 mt-1">von 1.602€ verfügbar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Asset-Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {allocationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-500">
                Keine Assets vorhanden
              </div>
            )}
          </CardContent>
        </Card>

        {/* Steuer-Übersicht */}
        <Card>
          <CardHeader>
            <CardTitle>Steuer-Übersicht {new Date().getFullYear()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Freistellungsauftrag</span>
                <span className="font-medium">{fsaUsed.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} / 1.602€</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-emerald-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (fsaUsed / 1602) * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-slate-600">Aktien-Verluste</p>
                <p className="text-lg font-bold text-red-600">
                  {(taxOptimization.find(t => t.pot_type === 'STOCK_LOSS_POT')?.amount_available || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Sonstige Verluste</p>
                <p className="text-lg font-bold text-red-600">
                  {(taxOptimization.find(t => t.pot_type === 'OTHER_LOSS_POT')?.amount_available || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>

            <Link to={createPageUrl('TaxReport')}>
              <Button className="w-full" variant="outline">
                Zur Steuer-Übersicht
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Top Holdings */}
      <Card>
        <CardHeader>
          <CardTitle>Top Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Asset</th>
                  <th className="text-right py-2">Menge</th>
                  <th className="text-right py-2">Kurs</th>
                  <th className="text-right py-2">Wert</th>
                  <th className="text-right py-2">Performance</th>
                </tr>
              </thead>
              <tbody>
                {topHoldings.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-500">
                      Keine Assets vorhanden. <Link to={createPageUrl('StocksAndETFs')} className="text-blue-600 underline">Jetzt hinzufügen</Link>
                    </td>
                  </tr>
                ) : (
                  topHoldings.map(asset => {
                    const gainLoss = (asset.current_value || 0) - ((asset.purchase_price_avg || 0) * asset.quantity);
                    const gainLossPercent = asset.purchase_price_avg > 0 
                      ? ((gainLoss / (asset.purchase_price_avg * asset.quantity)) * 100) 
                      : 0;
                    
                    return (
                      <tr key={asset.id} className="border-b hover:bg-slate-50">
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-xs text-slate-500">{asset.symbol || asset.isin}</p>
                          </div>
                        </td>
                        <td className="text-right">{asset.quantity.toFixed(4)}</td>
                        <td className="text-right">{(asset.current_price || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                        <td className="text-right font-medium">{(asset.current_value || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                        <td className="text-right">
                          <Badge variant={gainLoss >= 0 ? 'default' : 'destructive'} className={gainLoss >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                            {gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to={createPageUrl('StocksAndETFs')}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
              <p className="font-medium">Aktien & ETFs</p>
              <p className="text-xs text-slate-600 mt-1">
                {assets.filter(a => ['STOCK', 'ETF', 'MUTUAL_FUND'].includes(a.asset_class)).length} Positionen
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('Cryptocurrencies')}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <p className="font-medium">Kryptowährungen</p>
              <p className="text-xs text-slate-600 mt-1">
                {assets.filter(a => a.asset_class === 'CRYPTO').length} Positionen
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('PreciousMetals')}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <PieChartIcon className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
              <p className="font-medium">Edelmetalle</p>
              <p className="text-xs text-slate-600 mt-1">
                {assets.filter(a => ['GOLD', 'SILVER', 'PLATINUM'].includes(a.asset_class)).length} Positionen
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('TaxReport')}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <p className="font-medium">Steuer-Report</p>
              <p className="text-xs text-slate-600 mt-1">Anlage KAP</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}