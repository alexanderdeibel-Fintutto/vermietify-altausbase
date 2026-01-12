import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, FileText, TrendingUp, AlertCircle } from 'lucide-react';

export default function TaxReport() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', selectedYear],
    queryFn: async () => {
      const allTx = await base44.entities.AssetTransaction.list();
      return allTx.filter(tx => {
        const txYear = new Date(tx.transaction_date).getFullYear().toString();
        return txYear === selectedYear && ['SELL'].includes(tx.transaction_type);
      });
    },
  });

  const { data: dividends = [] } = useQuery({
    queryKey: ['dividends', selectedYear],
    queryFn: async () => {
      const allDiv = await base44.entities.Dividend.list();
      return allDiv.filter(d => d.tax_year.toString() === selectedYear);
    },
  });

  const { data: taxSettings } = useQuery({
    queryKey: ['taxSettings'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const settings = await base44.entities.UserTaxSettings.filter({ user_email: user.email });
      return settings[0] || null;
    },
  });

  // Berechnungen
  const totalCapitalGains = transactions.reduce((sum, tx) => sum + (tx.realized_gain_loss || 0), 0);
  const totalDividendsGross = dividends.reduce((sum, d) => sum + (d.amount_gross || 0), 0);
  const totalDividendsTaxed = dividends.reduce((sum, d) => sum + (d.tax_withheld || 0), 0);
  const totalDividendsNet = dividends.reduce((sum, d) => sum + (d.amount_net || 0), 0);

  // Vorabpauschale für thesaurierende ETFs
  const thesaurieringAssets = assets.filter(a => a.asset_class === 'ETF' && a.is_accumulating);
  const totalVorabpauschale = 0; // Würde aus Berechnung kommen

  // Capital Gains Tax (25% + 5.5% Soli + Kirchensteuer)
  const capitalGainsTax = totalCapitalGains * 0.25; // KapErtSt 25%
  const solidarityTax = totalCapitalGains * 0.055; // Soli 5.5%
  const churchTax = taxSettings?.church_member ? totalCapitalGains * 0.08 : 0; // Beispiel
  const totalCapitalGainsTax = capitalGainsTax + solidarityTax + churchTax;

  const netCapitalGains = totalCapitalGains - totalCapitalGainsTax;

  // Freistellungsauftrag
  const sparersPauschbetrag = taxSettings?.marital_status === 'VERHEIRATET' ? 1200 : 801;
  const usedSparersPauschbetrag = Math.min(totalDividendsGross + totalCapitalGains, sparersPauschbetrag);
  const remainingSparesPauschbetrag = sparersPauschbetrag - usedSparersPauschbetrag;

  // Gesamteinkommen
  const totalTaxableIncome = totalCapitalGains + totalDividendsGross + totalVorabpauschale;

  // Chart Data
  const incomeBreakdown = [
    { name: 'Kapitalgewinne', value: Math.max(0, totalCapitalGains) },
    { name: 'Dividenden', value: totalDividendsGross },
    { name: 'Vorabpauschale', value: totalVorabpauschale },
  ].filter(d => d.value > 0);

  const taxBreakdown = [
    { name: 'KapErtSt (25%)', value: capitalGainsTax },
    { name: 'Solidaritätszuschlag', value: solidarityTax },
    { name: 'Kirchensteuer', value: churchTax },
  ].filter(d => d.value > 0);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Steuerbericht</h1>
          <p className="text-slate-600 mt-1">Übersicht aller steuerrelevanten Transaktionen</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Als PDF exportieren
          </Button>
        </div>
      </div>

      {/* Jahr-Auswahl */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Steuerjahr auswählen</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
              <SelectItem value={(currentYear - 1).toString()}>{currentYear - 1}</SelectItem>
              <SelectItem value={(currentYear - 2).toString()}>{currentYear - 2}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Gesamtübersicht */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Steuerbares Einkommen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {totalTaxableIncome.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-slate-500 mt-1">{transactions.length + dividends.length} Transaktionen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Geschuldete Steuern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalCapitalGainsTax.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-slate-500 mt-1">KapErtSt + Soli + Kirche</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Sparerpauschbetrag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {remainingSparesPauschbetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Noch verfügbar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Netto nach Steuern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {netCapitalGains.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Einkommen-Zusammensetzung */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Einkommen nach Typ</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={incomeBreakdown} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${(value / totalTaxableIncome * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {incomeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Steuern nach Typ</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={taxBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Kapitalgewinne */}
      <Card>
        <CardHeader>
          <CardTitle>Realisierte Kapitalgewinne/-verluste</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-slate-600 text-sm">Keine Verkäufe im Jahr {selectedYear}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-medium text-slate-600">Datum</th>
                    <th className="text-left py-2 px-4 font-medium text-slate-600">Asset</th>
                    <th className="text-right py-2 px-4 font-medium text-slate-600">Menge</th>
                    <th className="text-right py-2 px-4 font-medium text-slate-600">Preis</th>
                    <th className="text-right py-2 px-4 font-medium text-slate-600">Gewinn/Verlust</th>
                    <th className="text-center py-2 px-4 font-medium text-slate-600">Haltefrist</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => {
                    const asset = assets.find(a => a.id === tx.asset_id);
                    const holdingDays = Math.floor((new Date(tx.transaction_date) - new Date(asset?.tax_holding_period_start || new Date())) / (1000 * 60 * 60 * 24));
                    const isTaxFree = holdingDays > 365;

                    return (
                      <tr key={tx.id} className="border-b hover:bg-slate-50">
                        <td className="py-2 px-4">{new Date(tx.transaction_date).toLocaleDateString('de-DE')}</td>
                        <td className="py-2 px-4 font-medium">{asset?.name}</td>
                        <td className="text-right py-2 px-4">{Math.abs(tx.quantity)}</td>
                        <td className="text-right py-2 px-4">{(tx.price_per_unit || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                        <td className={`text-right py-2 px-4 font-medium ${(tx.realized_gain_loss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(tx.realized_gain_loss || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        </td>
                        <td className="text-center py-2 px-4">
                          {isTaxFree ? (
                            <Badge className="bg-green-100 text-green-800">Steuerfrei</Badge>
                          ) : (
                            <span className="text-slate-600">{holdingDays} Tage</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dividenden */}
      <Card>
        <CardHeader>
          <CardTitle>Dividenden und Ausschüttungen</CardTitle>
        </CardHeader>
        <CardContent>
          {dividends.length === 0 ? (
            <p className="text-slate-600 text-sm">Keine Dividenden im Jahr {selectedYear}</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-xs text-slate-600">Brutto</p>
                  <p className="text-lg font-bold">{totalDividendsGross.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Einbehaltene Steuern</p>
                  <p className="text-lg font-bold text-red-600">{totalDividendsTaxed.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Netto</p>
                  <p className="text-lg font-bold text-green-600">{totalDividendsNet.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                </div>
              </div>

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
                    {dividends.map(div => (
                      <tr key={div.id} className="border-b hover:bg-slate-50">
                        <td className="py-2 px-4">{new Date(div.payment_date).toLocaleDateString('de-DE')}</td>
                        <td className="py-2 px-4 font-medium">{assets.find(a => a.id === div.asset_id)?.name}</td>
                        <td className="py-2 px-4">{div.dividend_type}</td>
                        <td className="text-right py-2 px-4">{(div.amount_gross || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                        <td className="text-right py-2 px-4 text-red-600">{(div.tax_withheld || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                        <td className="text-right py-2 px-4 font-medium">{(div.amount_net || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Freistellungsauftrag Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-blue-900">
            <FileText className="w-4 h-4" />
            Sparerpauschbetrag
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            Dein Sparerpauschbetrag: <span className="font-bold">{sparersPauschbetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
          </p>
          <p>
            Genutzt: <span className="font-bold">{usedSparersPauschbetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
          </p>
          <p>
            Noch verfügbar: <span className="font-bold">{remainingSparesPauschbetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}