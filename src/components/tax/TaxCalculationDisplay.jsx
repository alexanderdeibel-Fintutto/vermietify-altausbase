import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown } from 'lucide-react';

export default function TaxCalculationDisplay({ calculation, country, isLoading }) {
  if (isLoading) {
    return <div className="text-center py-4">⏳ Berechnung läuft...</div>;
  }

  if (!calculation) return null;

  const { taxes, summary } = calculation;
  const isAT = country === 'AT';
  const isCH = country === 'CH';

  return (
    <div className="space-y-4">
      {/* Main Tax Summary */}
      <Card className="border-2 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" /> Steuerberechnung {new Date().getFullYear()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {isAT && (
              <>
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-xs text-slate-600">Kapitalertrag</p>
                  <p className="text-lg font-bold">€{(summary.capitalTaxable || 0).toFixed(0)}</p>
                </div>
                <div className="p-3 bg-green-50 rounded">
                  <p className="text-xs text-slate-600">Sonstige Einkünfte</p>
                  <p className="text-lg font-bold">€{(summary.otherIncome || 0).toFixed(0)}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded">
                  <p className="text-xs text-slate-600">Zu versteuerndes Einkommen</p>
                  <p className="text-lg font-bold">€{(summary.totalTaxableIncome || 0).toFixed(0)}</p>
                </div>
              </>
            )}
            {isCH && (
              <>
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-xs text-slate-600">Kapitalerträge</p>
                  <p className="text-lg font-bold">CHF {((summary.dividendIncome || 0) + (summary.interestIncome || 0)).toFixed(0)}</p>
                </div>
                <div className="p-3 bg-green-50 rounded">
                  <p className="text-xs text-slate-600">Mietertrag</p>
                  <p className="text-lg font-bold">CHF {((summary.rentalIncome || 0) - (summary.rentalExpenses || 0)).toFixed(0)}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded">
                  <p className="text-xs text-slate-600">Gesamtvermögen</p>
                  <p className="text-lg font-bold">CHF {(summary.totalWealth || 0).toFixed(0)}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tax Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Steuerberechnung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isAT && (
              <>
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                  <span className="text-sm">Geschätzte Einkommensteuer</span>
                  <span className="font-bold">€{(taxes.estimatedIncomeTax || 0).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm text-slate-600">- KESt zurückbehalten</span>
                  <span className="text-slate-600">€{(taxes.kestWithheld || 0).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm text-slate-600">- Kirchensteuer</span>
                  <span className="text-slate-600">€{(taxes.churchTaxWithheld || 0).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm text-slate-600">- Ausländische Quellensteuer</span>
                  <span className="text-slate-600">€{(taxes.foreignTaxCredit || 0).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded border-t-2 mt-2 font-bold">
                  <span>Nachzahlung/Rückerstattung</span>
                  <span className={taxes.taxDue >= 0 ? 'text-red-600' : 'text-green-600'}>
                    {taxes.taxDue >= 0 ? '+' : ''}€{(taxes.taxDue || 0).toFixed(0)}
                  </span>
                </div>
              </>
            )}
            {isCH && (
              <>
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                  <span className="text-sm">Bundeseinkommensteuer</span>
                  <span className="font-bold">CHF {(taxes.federalIncomeTax || 0).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm">Kantonalsteuer</span>
                  <span className="font-bold">CHF {(taxes.cantonalIncomeTax || 0).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm">Gemeindesteuer</span>
                  <span className="font-bold">CHF {(taxes.communalIncomeTax || 0).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm">Vermögenssteuer</span>
                  <span className="font-bold">CHF {(taxes.wealthTax || 0).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm text-slate-600">- Verrechnungssteuer bezahlt</span>
                  <span className="text-slate-600">CHF {(taxes.withholdingTaxPaid || 0).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded border-t-2 mt-2 font-bold">
                  <span>Gesamtsteuerschuld</span>
                  <span className={taxes.totalTaxDue >= 0 ? 'text-red-600' : 'text-green-600'}>
                    CHF {(taxes.totalTaxDue || 0).toFixed(0)}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}