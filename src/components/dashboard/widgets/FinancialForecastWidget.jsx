import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FinancialForecastWidget() {
  const { data: payments = [] } = useQuery({
    queryKey: ['recent-payments'],
    queryFn: () => base44.entities.Payment.list('-date', 50)
  });

  const { data: financialItems = [] } = useQuery({
    queryKey: ['recent-financial-items'],
    queryFn: () => base44.entities.FinancialItem.list('-date', 50)
  });

  // Calculate trend from last 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentPayments = payments.filter(p => new Date(p.date) >= threeMonthsAgo);
  const recentItems = financialItems.filter(f => new Date(f.date) >= threeMonthsAgo);

  const totalIncome = recentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpenses = recentItems
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const avgMonthlyIncome = totalIncome / 3;
  const avgMonthlyExpenses = totalExpenses / 3;
  const avgMonthlyProfit = avgMonthlyIncome - avgMonthlyExpenses;

  // Simple forecast for next 3 months
  const forecastIncome = avgMonthlyIncome * 3;
  const forecastExpenses = avgMonthlyExpenses * 3;
  const forecastProfit = avgMonthlyProfit * 3;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Finanzprognose (3 Monate)</CardTitle>
          <Link to={createPageUrl('FinancialReports')}>
            <ArrowRight className="w-5 h-5 text-slate-500 hover:text-slate-700" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Forecast Summary */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-slate-600 mb-1">Einnahmen</p>
            <p className="text-lg font-bold text-green-600">
              {forecastIncome.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-1">Ausgaben</p>
            <p className="text-lg font-bold text-red-600">
              {forecastExpenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-1">Gewinn</p>
            <p className={`text-lg font-bold ${forecastProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {forecastProfit.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="pt-3 border-t">
          <div className="flex items-center gap-2">
            {forecastProfit >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <p className="text-sm text-slate-700">
              Basierend auf den letzten 3 Monaten
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}