import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FinancialForecastWidget() {
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: forecast, refetch, isLoading } = useQuery({
    queryKey: ['financialForecast'],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('generateFinancialForecast', {
          months_to_forecast: 6,
          historical_months: 12
        });
        return response.data?.forecast?.forecast_data;
      } catch (error) {
        console.warn('No forecast available:', error.message);
        return null;
      }
    },
    staleTime: 7 * 24 * 60 * 60 * 1000
  });

  const handleGenerateForecast = async () => {
    setIsGenerating(true);
    try {
      await refetch();
      toast.success('Finanzprognose aktualisiert');
    } catch (error) {
      toast.error('Fehler beim Generieren der Prognose');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!forecast) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Finanzprognose
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-sm text-slate-600">Noch keine Prognose vorhanden</p>
            <Button
              onClick={handleGenerateForecast}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generiere...
                </>
              ) : (
                'Prognose erstellen'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const incomeData = forecast.income_forecast?.map(f => ({
    month: f.month,
    forecast: f.predicted_income,
    confidence: f.confidence
  })) || [];

  const expenseData = forecast.expense_forecast?.map(f => ({
    month: f.month,
    forecast: f.predicted_expenses,
    confidence: f.confidence
  })) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Finanzprognose (6 Monate)
        </CardTitle>
        <Button
          onClick={handleGenerateForecast}
          disabled={isGenerating}
          size="sm"
          variant="outline"
        >
          {isGenerating ? 'Aktualisiert...' : 'Neu generieren'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="income" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="income">Einnahmeprognose</TabsTrigger>
            <TabsTrigger value="expenses">Ausgabeprognose</TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="space-y-4">
            {incomeData.length > 0 && (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={incomeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => `${value.toLocaleString('de-DE')} €`}
                    labelFormatter={(label) => `Monat: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#10b981"
                    name="Prognostizierte Einnahmen"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            {forecast.key_insights && (
              <div className="bg-green-50 p-3 rounded text-xs">
                <p className="font-semibold text-green-900 mb-2">📊 Erkenntnisse:</p>
                <ul className="space-y-1">
                  {forecast.key_insights.map((insight, i) => (
                    <li key={i} className="text-green-800">• {insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            {expenseData.length > 0 && (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={expenseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => `${value.toLocaleString('de-DE')} €`}
                    labelFormatter={(label) => `Monat: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#ef4444"
                    name="Prognostizierte Ausgaben"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            {forecast.risk_factors && (
              <div className="bg-amber-50 p-3 rounded text-xs">
                <p className="font-semibold text-amber-900 mb-2">⚠️ Risikofaktoren:</p>
                <ul className="space-y-1">
                  {forecast.risk_factors.map((risk, i) => (
                    <li key={i} className="text-amber-800">• {risk}</li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}