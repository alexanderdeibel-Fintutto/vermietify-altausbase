import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, DollarSign, TrendingDown, AlertCircle } from 'lucide-react';

export default function TaxEvents() {
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', filterYear],
    queryFn: async () => {
      const all = await base44.entities.AssetTransaction.list();
      return all.filter(tx => {
        const year = new Date(tx.transaction_date).getFullYear().toString();
        return year === filterYear && ['SELL'].includes(tx.transaction_type);
      });
    },
  });

  const { data: dividends = [] } = useQuery({
    queryKey: ['dividends', filterYear],
    queryFn: async () => {
      const all = await base44.entities.Dividend.list();
      return all.filter(d => d.tax_year.toString() === filterYear);
    },
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list(),
  });

  // Berechne Statistiken
  const totalCapitalGains = transactions.reduce((sum, tx) => sum + Math.max(0, tx.realized_gain_loss || 0), 0);
  const totalCapitalLosses = transactions.reduce((sum, tx) => sum + Math.min(0, tx.realized_gain_loss || 0), 0);
  const totalDividends = dividends.reduce((sum, d) => sum + (d.amount_gross || 0), 0);
  const totalTaxesPaid = dividends.reduce((sum, d) => sum + (d.tax_withheld || 0), 0);

  // Gruppiere Transaktionen nach Monat
  const transactionsByMonth = transactions.reduce((acc, tx) => {
    const month = new Date(tx.transaction_date).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(tx);
    return acc;
  }, {});

  const dividendsByMonth = dividends.reduce((acc, div) => {
    const month = new Date(div.payment_date).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(div);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Steuerereignisse</h1>
        <p className="text-slate-600 mt-1">Übersicht aller steuerrelevanten Transaktionen und Ereignisse</p>
      </div>

      {/* Year Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map(year => (
              <Badge
                key={year}
                variant={filterYear === year.toString() ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilterYear(year.toString())}
              >
                {year}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Kapitalgewinne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalCapitalGains.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Kapitallverluste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalCapitalLosses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Dividenden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalDividends.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Steuern gezahlt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {totalTaxesPaid.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Tabs */}
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales">Verkäufe ({transactions.length})</TabsTrigger>
          <TabsTrigger value="dividends">Dividenden ({dividends.length})</TabsTrigger>
        </TabsList>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          {Object.entries(transactionsByMonth).map(([month, txs]) => (
            <Card key={month}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {month}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4 font-medium text-slate-600">Datum</th>
                        <th className="text-left py-2 px-4 font-medium text-slate-600">Asset</th>
                        <th className="text-right py-2 px-4 font-medium text-slate-600">Menge</th>
                        <th className="text-right py-2 px-4 font-medium text-slate-600">Verkaufspreis</th>
                        <th className="text-right py-2 px-4 font-medium text-slate-600">Gewinn/Verlust</th>
                        <th className="text-center py-2 px-4 font-medium text-slate-600">Haltefrist</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txs.map(tx => {
                        const asset = assets.find(a => a.id === tx.asset_id);
                        const holdingDays = Math.floor(
                          (new Date(tx.transaction_date) - new Date(asset?.tax_holding_period_start || new Date())) /
                            (1000 * 60 * 60 * 24)
                        );
                        const isTaxFree = holdingDays > 365;

                        return (
                          <tr key={tx.id} className="border-b hover:bg-slate-50">
                            <td className="py-2 px-4">{new Date(tx.transaction_date).toLocaleDateString('de-DE')}</td>
                            <td className="py-2 px-4 font-medium">{asset?.name}</td>
                            <td className="text-right py-2 px-4">{Math.abs(tx.quantity)}</td>
                            <td className="text-right py-2 px-4">
                              {(tx.price_per_unit || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </td>
                            <td className={`text-right py-2 px-4 font-bold ${(tx.realized_gain_loss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {(tx.realized_gain_loss || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </td>
                            <td className="text-center py-2 px-4">
                              {isTaxFree ? (
                                <Badge className="bg-green-100 text-green-800">Steuerfrei</Badge>
                              ) : (
                                <span className="text-slate-600">{holdingDays}d</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}

          {transactions.length === 0 && (
            <Card className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600">Keine Verkäufe im Jahr {filterYear}</p>
            </Card>
          )}
        </TabsContent>

        {/* Dividends Tab */}
        <TabsContent value="dividends" className="space-y-4">
          {Object.entries(dividendsByMonth).map(([month, divs]) => (
            <Card key={month}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {month}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4 font-medium text-slate-600">Datum</th>
                        <th className="text-left py-2 px-4 font-medium text-slate-600">Asset</th>
                        <th className="text-left py-2 px-4 font-medium text-slate-600">Typ</th>
                        <th className="text-right py-2 px-4 font-medium text-slate-600">Brutto</th>
                        <th className="text-right py-2 px-4 font-medium text-slate-600">Steuern</th>
                        <th className="text-right py-2 px-4 font-medium text-slate-600">Netto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {divs.map(div => (
                        <tr key={div.id} className="border-b hover:bg-slate-50">
                          <td className="py-2 px-4">{new Date(div.payment_date).toLocaleDateString('de-DE')}</td>
                          <td className="py-2 px-4 font-medium">{assets.find(a => a.id === div.asset_id)?.name}</td>
                          <td className="py-2 px-4">
                            <Badge variant="outline">{div.dividend_type}</Badge>
                          </td>
                          <td className="text-right py-2 px-4">{(div.amount_gross || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                          <td className="text-right py-2 px-4 text-red-600">{(div.tax_withheld || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                          <td className="text-right py-2 px-4 font-medium">{(div.amount_net || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}

          {dividends.length === 0 && (
            <Card className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600">Keine Dividenden im Jahr {filterYear}</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}