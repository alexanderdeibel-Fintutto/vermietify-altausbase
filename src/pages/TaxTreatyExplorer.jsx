import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, FileText, AlertCircle } from 'lucide-react';

const COUNTRIES = [
  { code: 'DE', name: 'Deutschland' },
  { code: 'CH', name: 'Schweiz' },
  { code: 'AT', name: 'Österreich' },
  { code: 'US', name: 'USA' },
  { code: 'UK', name: 'Vereinigtes Königreich' }
];

const INCOME_TYPES = [
  'Salaries',
  'Business Profits',
  'Dividends',
  'Interest',
  'Royalties',
  'Capital Gains',
  'Rental Income'
];

export default function TaxTreatyExplorer() {
  const [country1, setCountry1] = useState('DE');
  const [country2, setCountry2] = useState('CH');
  const [incomeType, setIncomeType] = useState('Dividends');
  const [result, setResult] = useState(null);

  const exploreTreaty = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('generateTaxTreatyNavigator', {
        country1,
        country2,
        income_type: incomeType
      });
      return res.data;
    },
    onSuccess: (data) => setResult(data)
  });

  const swapCountries = () => {
    setCountry1(country2);
    setCountry2(country1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light">Tax Treaty Navigator</h1>
        <p className="text-slate-500 font-light mt-2">Finde optimale Steuerbehandlung grenzüberschreitender Einkünfte</p>
      </div>

      {/* Treaty Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Wähle Länder & Einkunftsart</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 items-center">
            {/* Country 1 */}
            <div>
              <label className="text-xs font-light text-slate-600 block mb-2">Von Land</label>
              <select
                value={country1}
                onChange={(e) => setCountry1(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-light"
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-end items-end pb-2">
              <Button
                onClick={swapCountries}
                variant="outline"
                size="sm"
                className="text-xs font-light"
              >
                ⇄
              </Button>
            </div>

            {/* Country 2 */}
            <div>
              <label className="text-xs font-light text-slate-600 block mb-2">Zu Land</label>
              <select
                value={country2}
                onChange={(e) => setCountry2(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-light"
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Income Type */}
            <div>
              <label className="text-xs font-light text-slate-600 block mb-2">Einkunftsart</label>
              <select
                value={incomeType}
                onChange={(e) => setIncomeType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-light"
              >
                {INCOME_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={() => exploreTreaty.mutate()}
            disabled={exploreTreaty.isPending || country1 === country2}
            className="w-full"
          >
            {exploreTreaty.isPending ? 'Analysiere Treaty...' : 'Treaty analysieren'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Treaty-Analyse: {country1} ↔ {country2}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">Übersicht</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="docs">Dokumente</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-3 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600 font-light">Tax Rate {country1}</p>
                      <p className="text-lg font-light mt-1">{(result.treaty_analysis.tax_rate_country1 * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600 font-light">Tax Rate {country2}</p>
                      <p className="text-lg font-light mt-1">{(result.treaty_analysis.tax_rate_country2 * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg col-span-2">
                      <p className="text-xs text-slate-600 font-light">Effektive Rate nach Treaty</p>
                      <p className="text-lg font-light mt-1 text-green-700">{(result.treaty_analysis.effective_tax_rate * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <p className="text-sm font-light"><strong>Treaty:</strong> {result.treaty_analysis.treaty_signed}</p>
                    <p className="text-sm font-light"><strong>Applicable Article:</strong> {result.treaty_analysis.applicable_article}</p>
                    <p className="text-sm font-light"><strong>Relief Method:</strong> {result.treaty_analysis.relief_method}</p>
                    <p className="text-sm font-light"><strong>Withholding Tax Limit:</strong> {(result.treaty_analysis.withholding_tax_limit * 100).toFixed(1)}%</p>
                  </div>
                </TabsContent>

                <TabsContent value="docs" className="space-y-2 mt-4">
                  {result.treaty_analysis.required_documentation?.map((doc, i) => (
                    <div key={i} className="p-3 border border-slate-200 rounded-lg flex items-start gap-2">
                      <FileText className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                      <p className="text-sm font-light">{doc}</p>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}