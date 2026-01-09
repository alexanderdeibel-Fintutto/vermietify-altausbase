import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function RollingBudgetTimeline({ budget }) {
  const [selectedCategory, setSelectedCategory] = useState(
    budget?.categories?.[0]?.category_name || null
  );

  if (!budget?.periods || budget.periods.length === 0) {
    return (
      <Card className="bg-slate-50">
        <CardContent className="pt-4 text-center">
          <p className="text-sm text-slate-600">Keine Perioden generiert</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare timeline data
  const timelineData = budget.periods.map(period => {
    const data = {
      period: `P${period.period_number}`,
      start: period.period_start,
      end: period.period_end
    };

    Object.entries(period.category_budgets || {}).forEach(([category, amount]) => {
      data[category] = amount;
    });

    return data;
  });

  // Get total budget per period
  const totalPerPeriod = budget.periods.map(period => ({
    period: `P${period.period_number}`,
    total: Object.values(period.category_budgets || {}).reduce((a, b) => a + b, 0)
  }));

  const COLORS = ['#0f172a', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'];

  return (
    <div className="space-y-4">
      {/* Overall Budget Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gesamtbudget-Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={totalPerPeriod}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toLocaleString('de-DE')} €`} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Gesamtbudget"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kategorien-Analyse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {budget.categories.map(cat => (
              <Badge
                key={cat.category_name}
                variant={selectedCategory === cat.category_name ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat.category_name)}
              >
                {cat.category_name}
              </Badge>
            ))}
          </div>

          {selectedCategory && (
            <div>
              <p className="text-xs text-slate-600 mb-3">
                Wachstumsrate: {
                  budget.categories.find(c => c.category_name === selectedCategory)?.growth_rate || 0
                }% pro Periode
              </p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value.toLocaleString('de-DE')} €`} />
                  <Bar
                    dataKey={selectedCategory}
                    fill="#6366f1"
                    name={selectedCategory}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Period Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perioden-Details</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-semibold">Periode</th>
                <th className="text-left py-2 px-2 font-semibold">Zeitraum</th>
                {budget.categories.slice(0, 4).map(cat => (
                  <th key={cat.category_name} className="text-right py-2 px-2 font-semibold">
                    {cat.category_name}
                  </th>
                ))}
                <th className="text-right py-2 px-2 font-semibold">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {budget.periods.map((period, idx) => {
                const total = Object.values(period.category_budgets || {}).reduce((a, b) => a + b, 0);
                return (
                  <tr key={period.period_number} className="border-b hover:bg-slate-50">
                    <td className="py-2 px-2 font-semibold">P{period.period_number}</td>
                    <td className="py-2 px-2 text-slate-600">
                      {new Date(period.period_start).toLocaleDateString('de-DE', {
                        month: 'short',
                        day: 'numeric'
                      })} - {new Date(period.period_end).toLocaleDateString('de-DE', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    {budget.categories.slice(0, 4).map(cat => (
                      <td key={cat.category_name} className="py-2 px-2 text-right">
                        {(period.category_budgets?.[cat.category_name] || 0).toLocaleString('de-DE')} €
                      </td>
                    ))}
                    <td className="py-2 px-2 text-right font-semibold">
                      {total.toLocaleString('de-DE')} €
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}