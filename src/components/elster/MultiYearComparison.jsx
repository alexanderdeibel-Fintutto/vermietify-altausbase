import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function MultiYearComparison({ submissions, formType = 'ANLAGE_V' }) {
  const formSubmissions = submissions
    .filter(s => (s.form_type === formType || s.tax_form_type === formType) && s.status === 'ACCEPTED')
    .sort((a, b) => a.tax_year - b.tax_year);

  if (formSubmissions.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mehrjahresvergleich</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-500 py-8">
            Mindestens 2 akzeptierte Submissions benötigt
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = formSubmissions.map(sub => ({
    year: sub.tax_year,
    einnahmen: sub.form_data?.income_rent || 0,
    ausgaben: (sub.form_data?.expense_property_tax || 0) + 
              (sub.form_data?.expense_insurance || 0) + 
              (sub.form_data?.expense_maintenance || 0) +
              (sub.form_data?.expense_administration || 0),
    gewinn: (sub.form_data?.income_rent || 0) - 
            ((sub.form_data?.expense_property_tax || 0) + 
             (sub.form_data?.expense_insurance || 0) + 
             (sub.form_data?.expense_maintenance || 0) +
             (sub.form_data?.expense_administration || 0))
  }));

  const calculateTrend = (field) => {
    if (chartData.length < 2) return null;
    const first = chartData[0][field];
    const last = chartData[chartData.length - 1][field];
    const change = ((last - first) / first) * 100;
    return { change, isPositive: change > 0 };
  };

  const trends = {
    einnahmen: calculateTrend('einnahmen'),
    ausgaben: calculateTrend('ausgaben'),
    gewinn: calculateTrend('gewinn')
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mehrjahresvergleich {formType}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(trends).map(([key, trend]) => {
            if (!trend) return null;
            const Icon = trend.isPositive ? TrendingUp : TrendingDown;
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            
            return (
              <div key={key} className="p-4 border rounded-lg">
                <div className="text-sm text-slate-600 mb-1">{label}</div>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {chartData[0].year} → {chartData[chartData.length - 1].year}
                </div>
              </div>
            );
          })}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip 
              formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="einnahmen" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Einnahmen"
            />
            <Line 
              type="monotone" 
              dataKey="ausgaben" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Ausgaben"
            />
            <Line 
              type="monotone" 
              dataKey="gewinn" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Gewinn"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="pt-4 border-t">
          <div className="text-sm font-medium mb-3">Jahresdetails</div>
          <div className="space-y-2">
            {formSubmissions.map(sub => (
              <div key={sub.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{sub.tax_year}</Badge>
                  <span className="text-sm text-slate-600">{sub.tax_form_type}</span>
                </div>
                <div className="text-sm font-medium">
                  {((sub.form_data?.income_rent || 0) - 
                    ((sub.form_data?.expense_property_tax || 0) + 
                     (sub.form_data?.expense_insurance || 0) + 
                     (sub.form_data?.expense_maintenance || 0))).toLocaleString('de-DE', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}