import React, { useState, useMemo } from 'react';
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
import { TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function RealTimeTaxCalculator() {
  const [country, setCountry] = useState('DE');
  const [income, setIncome] = useState(100000);
  const [deductions, setDeductions] = useState(10000);
  const [payments, setPayments] = useState(0);
  const [filingStatus, setFilingStatus] = useState('single');

  const { data: estimate = {}, isLoading } = useQuery({
    queryKey: ['realTimeTaxEstimate', country, income, deductions, payments, filingStatus],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculateRealTimeTaxEstimate', {
        country,
        income,
        deductions,
        payments,
        filingStatus
      });
      return response.data?.estimate || {};
    }
  });

  const taxableIncome = Math.max(0, income - deductions);
  const estimatedLiability = estimate.content?.estimated_tax_liability || 0;
  const remainingLiability = estimate.content?.remaining_liability || 0;
  const effectiveRate = estimate.content?.effective_tax_rate || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🧮 Echtzeit-Steuer-Rechner</h1>
        <p className="text-slate-500 mt-1">Berechnen Sie Ihre Steuerlast während der Eingabe</p>
      </div>

      {/* Input Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Eingaben</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry}>
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
              <label className="text-sm font-medium">Familienstand</label>
              <Select value={filingStatus} onValueChange={setFilingStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Ledig</SelectItem>
                  <SelectItem value="married">Verheiratet</SelectItem>
                  <SelectItem value="divorced">Geschieden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Bruttoeinkommen (€)</label>
              <Input
                type="number"
                value={income}
                onChange={(e) => setIncome(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Abzüge (€)</label>
              <Input
                type="number"
                value={deductions}
                onChange={(e) => setDeductions(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Gezahlte Steuern (€)</label>
              <Input
                type="number"
                value={payments}
                onChange={(e) => setPayments(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-slate-600">Zu versteuerndes Einkommen</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">€{taxableIncome.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-slate-600">Geschätzte Steuerlast</p>
            <p className="text-2xl font-bold text-red-600 mt-2">€{Math.round(estimatedLiability).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-slate-600">Effektiver Steuersatz</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">{Math.round(effectiveRate * 100)}%</p>
          </CardContent>
        </Card>
        <Card className={`${remainingLiability > 0 ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-slate-600">{remainingLiability > 0 ? 'Restliche Zahlung' : 'Rückerstattung'}</p>
            <p className={`text-2xl font-bold mt-2 ${remainingLiability > 0 ? 'text-red-600' : 'text-green-600'}`}>
              €{Math.abs(Math.round(remainingLiability)).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      {estimate.content && (
        <>
          {/* Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📋 Steuer-Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span>Bruttoeinkommen</span>
                  <span className="font-bold">€{income.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Abzüge</span>
                  <span className="font-bold">-€{deductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b font-bold">
                  <span>Zu versteuerndes Einkommen</span>
                  <span>€{taxableIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Geschätzte Steuerlast</span>
                  <span className="font-bold text-red-600">€{Math.round(estimatedLiability).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 font-bold">
                  <span>Bereits gezahlt</span>
                  <span className="text-green-600">€{payments.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 font-bold text-lg">
                  <span>Noch zu zahlen / Rückerstattung</span>
                  <span className={remainingLiability > 0 ? 'text-red-600' : 'text-green-600'}>
                    €{Math.round(remainingLiability).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Items */}
          {(estimate.content?.action_items || []).length > 0 && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Aktionsschritte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {estimate.content.action_items.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Payment Schedule */}
          {(estimate.content?.payment_schedule || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📅 Zahlungsplan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {estimate.content.payment_schedule.map((schedule, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded">
                    • {schedule}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}