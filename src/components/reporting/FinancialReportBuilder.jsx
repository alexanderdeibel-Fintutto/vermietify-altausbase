import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function FinancialReportBuilder({ buildingId }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [dates, setDates] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateFinancialReport', {
        buildingId,
        startDate: dates.startDate,
        endDate: dates.endDate
      });

      setReport(response.data.report);
      toast.success('Finanzbericht erstellt');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!report ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Finanzbericht
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Von</label>
                <input
                  type="date"
                  value={dates.startDate}
                  onChange={(e) => setDates({...dates, startDate: e.target.value})}
                  className="w-full mt-2 border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Bis</label>
                <input
                  type="date"
                  value={dates.endDate}
                  onChange={(e) => setDates({...dates, endDate: e.target.value})}
                  className="w-full mt-2 border rounded px-3 py-2 text-sm"
                />
              </div>
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generiere...
                </>
              ) : (
                'Bericht generieren'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <p className="text-center text-sm text-slate-600">Zeitraum: {report.period}</p>
            </CardContent>
          </Card>

          {/* Profitability */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rentabilität</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                  <p className="text-xs text-green-700">Bruttoprofit</p>
                  <p className="text-xl font-bold text-green-600 mt-2">
                    €{report.profitability.gross_profit?.toLocaleString('de-DE', { maximumFractionDigits: 2 }) || '0'}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                  <p className="text-xs text-blue-700">Marge</p>
                  <p className="text-xl font-bold text-blue-600 mt-2">
                    {(report.profitability.profit_margin || 0).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                  <p className="text-xs text-purple-700">ROI</p>
                  <p className="text-xl font-bold text-purple-600 mt-2">
                    {(report.profitability.roi || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Income */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Einnahmen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600 mb-4">
                €{report.income_summary.total?.toLocaleString('de-DE', { maximumFractionDigits: 2 }) || '0'}
              </p>
              {report.income_summary.by_category && (
                <div className="space-y-2">
                  {report.income_summary.by_category.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-700">{item.category}</span>
                      <span className="font-bold">€{item.amount?.toLocaleString('de-DE', { maximumFractionDigits: 2 }) || '0'}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expenses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ausgaben</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600 mb-4">
                €{report.expense_summary.total?.toLocaleString('de-DE', { maximumFractionDigits: 2 }) || '0'}
              </p>
              {report.expense_summary.by_category && (
                <div className="space-y-2">
                  {report.expense_summary.by_category.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-700">{item.category}</span>
                      <span className="font-bold">€{item.amount?.toLocaleString('de-DE', { maximumFractionDigits: 2 }) || '0'}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cash Flow */}
          {report.cash_flow_analysis && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Cashflow-Analyse</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700">{report.cash_flow_analysis}</p>
              </CardContent>
            </Card>
          )}

          {/* Tax Info */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <p className="text-xs text-slate-600">Steuerlich abzugsfähig</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                €{(report.tax_deductible || 0).toLocaleString('de-DE', { maximumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          {/* Insights */}
          {report.insights?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Erkenntnisse</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.insights.map((insight, idx) => (
                    <li key={idx} className="flex gap-2 text-sm">
                      <span className="text-green-600">✓</span>
                      <span className="text-slate-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={() => setReport(null)}
            variant="outline"
            className="w-full"
          >
            Neuer Bericht
          </Button>
        </div>
      )}
    </div>
  );
}