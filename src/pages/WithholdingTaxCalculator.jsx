import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, TrendingDown } from 'lucide-react';

export default function WithholdingTaxCalculator() {
  const [country, setCountry] = useState('DE');
  const [incomeType, setIncomeType] = useState('dividend');
  const [amount, setAmount] = useState(10000);
  const [calculating, setCalculating] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['withholdingTax', country, incomeType, amount],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculateWithholdingTax', {
        country,
        incomeType,
        amount
      });
      return response.data?.calculation || {};
    },
    enabled: calculating
  });

  const withholdingAmount = result.content?.tax_withheld || 0;
  const netAmount = result.content?.net_amount || 0;
  const withholdingRate = result.content?.withholding_rate || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🧾 Quellensteuer-Rechner</h1>
        <p className="text-slate-500 mt-1">Berechnen Sie Quellensteuer und Nettobetrag</p>
      </div>

      {/* Input Form */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Quellensteuer-Parameter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={calculating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
                  <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
                  <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Einkommensart</label>
              <Select value={incomeType} onValueChange={setIncomeType} disabled={calculating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dividend">Dividende</SelectItem>
                  <SelectItem value="interest">Zinsen</SelectItem>
                  <SelectItem value="royalty">Lizenzgebühr</SelectItem>
                  <SelectItem value="service_fee">Servicegebühr</SelectItem>
                  <SelectItem value="capital_gain">Kapitalgewinn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Bruttobetrag (€)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              disabled={calculating}
            />
          </div>

          <button
            onClick={() => setCalculating(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={calculating}
          >
            {calculating ? '⏳ Wird berechnet...' : 'Berechnen'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Berechnung läuft...</div>
      ) : calculating && result.content ? (
        <>
          {/* Results Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Steuersatz</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {Math.round(withholdingRate * 100)}%
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Einbehaltene Steuer</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  €{Math.round(withholdingAmount).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Nettobetrag</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  €{Math.round(netAmount).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📋 Quellensteuer-Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span>Bruttobetrag</span>
                  <span className="font-bold">€{amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Quellensteuer ({Math.round(withholdingRate * 100)}%)</span>
                  <span className="font-bold text-red-600">-€{Math.round(withholdingAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 font-bold text-lg">
                  <span>Nettobetrag</span>
                  <span className="text-green-600">€{Math.round(netAmount).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recovery Options */}
          {(result.content?.recovery_options || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Rückgewinnungsmöglichkeiten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.recovery_options.map((option, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {option}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Required Forms */}
          {(result.content?.required_forms || []).length > 0 && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">📄 Erforderliche Formulare</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.required_forms.map((form, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {form}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Deadlines */}
          {(result.content?.deadlines || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm">📅 Fristen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.deadlines.map((deadline, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {deadline}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Geben Sie die Werte ein und klicken Sie "Berechnen"
        </div>
      )}
    </div>
  );
}