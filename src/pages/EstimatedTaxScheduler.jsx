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
import { Calendar, DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function EstimatedTaxScheduler() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [estimatedIncome, setEstimatedIncome] = useState(100000);
  const [estimatedTax, setEstimatedTax] = useState(30000);
  const [scheduling, setScheduling] = useState(false);

  const { data: schedule = {}, isLoading } = useQuery({
    queryKey: ['estimatedTaxSchedule', country, taxYear, estimatedIncome, estimatedTax],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculateEstimatedTaxPayments', {
        country,
        taxYear,
        estimatedIncome,
        estimatedTax
      });
      return response.data?.schedule || {};
    },
    enabled: scheduling
  });

  const quarterlyAmount = schedule.metrics?.quarterly_amount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📅 Vierteljährliche Steuerzahlung Planer</h1>
        <p className="text-slate-500 mt-1">Planen Sie Ihre vierteljährlichen Steuerzahlungen</p>
      </div>

      {/* Input Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Steuerdaten</CardTitle>
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
                  {[CURRENT_YEAR - 1, CURRENT_YEAR].map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Geschätztes Einkommen (€)</label>
              <Input
                type="number"
                value={estimatedIncome}
                onChange={(e) => setEstimatedIncome(parseInt(e.target.value))}
                disabled={scheduling}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Geschätzte Gesamtsteuer (€)</label>
              <Input
                type="number"
                value={estimatedTax}
                onChange={(e) => setEstimatedTax(parseInt(e.target.value))}
                disabled={scheduling}
              />
            </div>
          </div>

          <button
            onClick={() => setScheduling(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={scheduling}
          >
            {scheduling ? '⏳ Wird berechnet...' : 'Zahlung planen'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Zahlungsplan wird erstellt...</div>
      ) : scheduling && schedule.content ? (
        <>
          {/* Quarterly Summary */}
          <Card className="border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                💰 Vierteljährliche Zahlungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(q => (
                  <div key={q} className="text-center p-3 bg-white rounded">
                    <p className="text-xs text-slate-600">Q{q}</p>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      €{Math.round(quarterlyAmount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Schedule */}
          {(schedule.content?.payment_schedule || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  📅 Zahlungstermine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {schedule.content.payment_schedule.map((date, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {date}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quarterly Payments Details */}
          {(schedule.content?.quarterly_payments || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Zahlungsdetails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {schedule.content.quarterly_payments.map((payment, i) => (
                  <div key={i} className="border-l-4 border-blue-300 pl-3 py-2">
                    <p className="font-medium text-sm">Quartal {i + 1}</p>
                    <p className="text-xs text-slate-600">
                      €{Math.round(payment.amount || 0).toLocaleString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Safe Harbor Analysis */}
          {schedule.content?.safe_harbor_analysis && (
            <Card className="border-purple-300 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Safe Harbor Regeln</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(schedule.content.safe_harbor_analysis).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b last:border-b-0">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Penalty Risk */}
          {schedule.content?.penalty_risk && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  ⚠️ Strafzinsrisiko
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(schedule.content.penalty_risk).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b last:border-b-0">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tracking Checklist */}
          {(schedule.content?.tracking_checklist || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">✓ Verfolgungscheckliste</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {schedule.content.tracking_checklist.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-green-50 rounded flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Füllen Sie Ihre Daten aus und klicken Sie "Zahlung planen"
        </div>
      )}
    </div>
  );
}