import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function BudgetForecastingWidget() {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [budgets, setBudgets] = useState(null);

  const handleForecast = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('predictBudgetAndForecasting', {
        months_ahead: 3
      });

      setForecast(response.data.forecast);
      setBudgets(response.data.budget_recommendations);
      toast.success('Prognose berechnet');
    } catch (error) {
      toast.error('Prognose fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const chartData = forecast?.map(month => ({
    month: month.month,
    ...Object.fromEntries(
      Object.entries(month.categories).map(([cat, data]) => [cat, Math.round(data.predicted)])
    )
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Budget & Prognose
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleForecast}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Berechne...
              </>
            ) : (
              'Prognose generieren'
            )}
          </Button>
        </CardContent>
      </Card>

      {forecast && (
        <>
          {/* Forecast Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">3-Monats-Prognose</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `€${value.toFixed(0)}`} />
                  <Legend />
                  {Object.keys(chartData[0] || {})
                    .filter(k => k !== 'month')
                    .slice(0, 4)
                    .map((cat, i) => (
                      <Bar key={i} dataKey={cat} stackId="a" fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i]} />
                    ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Budget Recommendations */}
          {budgets && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Budget-Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(budgets).map(([category, budget]) => (
                  <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm capitalize">{category}</p>
                      <p className="text-xs text-slate-600">{budget.based_on}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">€{budget.recommended.toFixed(0)}</p>
                      <p className="text-xs text-slate-500">+{Math.round((budget.safety_margin - 1) * 100)}% Buffer</p>
                    </div>
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