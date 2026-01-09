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
import { Calendar, DollarSign, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function EstimatedTaxScheduler() {
  const [country, setCountry] = useState('DE');
  const [estimatedTaxLiability, setEstimatedTaxLiability] = useState(25000);
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [scheduling, setScheduling] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['estimatedTaxSchedule', country, estimatedTaxLiability, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateEstimatedTaxSchedule', {
        country,
        estimatedTaxLiability,
        taxYear
      });
      return response.data?.schedule || {};
    },
    enabled: scheduling
  });

  const quarterlyPayments = result.content?.quarterly_payments || [];
  const totalAnnual = result.content?.total_annual || estimatedTaxLiability;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📅 Geschätzte Steuer-Planer</h1>
        <p className="text-slate-500 mt-1">Erstellen Sie einen vierteljährlichen Zahlungsplan</p>
      </div>

      {/* Input Form */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Zahlungsplan-Parameter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={scheduling}>
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
              <label className="text-sm font-medium">Steuerjahr</label>
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={scheduling}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Geschätzte Steuerlast (€)</label>
            <Input
              type="number"
              value={estimatedTaxLiability}
              onChange={(e) => setEstimatedTaxLiability(parseInt(e.target.value) || 0)}
              disabled={scheduling}
            />
          </div>

          <button
            onClick={() => setScheduling(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={scheduling}
          >
            {scheduling ? '⏳ Wird erstellt...' : 'Zahlungsplan erstellen'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Zahlungsplan wird erstellt...</div>
      ) : scheduling && result.content ? (
        <>
          {/* Total Amount */}
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-slate-600">Gesamte geschätzte Jahressteuerzahlung</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                €{Math.round(totalAnnual).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {/* Quarterly Payments Table */}
          {quarterlyPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Vierteljährliche Zahlungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quarterlyPayments.map((payment, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded border-l-4 border-blue-400">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{payment.quarter || `Q${i + 1}`} {taxYear}</p>
                        <p className="text-lg font-bold text-blue-600">€{Math.round(payment.amount || 0).toLocaleString()}</p>
                      </div>
                      {payment.due_date && <p className="text-xs text-slate-600 mt-1">Fällig: {payment.due_date}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Safe Harbor */}
          {result.content?.safe_harbor_met !== undefined && (
            <Card className={result.content.safe_harbor_met ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Safe Harbor Status</p>
                    <p className={`text-xs mt-1 ${result.content.safe_harbor_met ? 'text-green-600' : 'text-red-600'}`}>
                      {result.content.safe_harbor_met ? '✓ Erfüllt' : '⚠️ Nicht erfüllt'}
                    </p>
                  </div>
                  <p className="text-lg font-bold">€{Math.round(result.content.safe_harbor_amount || 0).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Underpayment Penalty */}
          {result.content?.underpayment_penalty && (
            <Card className="border-orange-300 bg-orange-50">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">Mögliche Unterzahlungsstrafe</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">
                  €{Math.round(result.content.underpayment_penalty).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Payment Methods */}
          {(result.content?.payment_schedule || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💳 Zahlungsmethoden</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.payment_schedule.map((method, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded">
                    • {method}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Extension Info */}
          {result.content?.extension_option && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">📋 Verlängerungsoption</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{result.content.extension_option}</p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Geben Sie die Werte ein und klicken Sie "Zahlungsplan erstellen"
        </div>
      )}
    </div>
  );
}