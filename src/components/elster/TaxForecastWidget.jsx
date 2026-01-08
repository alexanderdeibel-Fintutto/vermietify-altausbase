import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TaxForecastWidget() {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateForecast = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('forecastTaxLiability', {
        years_ahead: 3
      });

      if (response.data.success) {
        setForecast(response.data);
        toast.success('Prognose generiert');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Prognose fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = forecast ? [
    ...Object.entries(forecast.historical).map(([year, data]) => ({
      year: parseInt(year),
      einnahmen: data.einnahmen,
      ausgaben: data.ausgaben,
      type: 'historisch'
    })),
    ...forecast.forecast.map(f => ({
      year: f.year,
      einnahmen: f.einnahmen,
      ausgaben: f.ausgaben,
      type: 'prognose'
    }))
  ] : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Steuer-Prognose
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={generateForecast} disabled={loading} className="w-full">
          {loading ? 'Berechne...' : '3-Jahres-Prognose generieren'}
        </Button>

        {forecast && (
          <div className="space-y-4 pt-4 border-t">
            {forecast.growth_rates && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-emerald-50 rounded">
                  <div className="text-slate-600">Ø Wachstum Einnahmen</div>
                  <div className="font-bold text-emerald-600">
                    {forecast.growth_rates.einnahmen > 0 ? '+' : ''}{forecast.growth_rates.einnahmen}%
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <div className="text-slate-600">Ø Wachstum Ausgaben</div>
                  <div className="font-bold">
                    {forecast.growth_rates.ausgaben > 0 ? '+' : ''}{forecast.growth_rates.ausgaben}%
                  </div>
                </div>
              </div>
            )}

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => `€${value.toLocaleString('de-DE')}`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="einnahmen" 
                  stroke="#10b981" 
                  name="Einnahmen"
                  strokeDasharray={(entry) => entry.type === 'prognose' ? '5 5' : '0'}
                />
                <Line 
                  type="monotone" 
                  dataKey="ausgaben" 
                  stroke="#ef4444" 
                  name="Ausgaben"
                  strokeDasharray={(entry) => entry.type === 'prognose' ? '5 5' : '0'}
                />
              </LineChart>
            </ResponsiveContainer>

            {forecast.forecast && (
              <div className="space-y-2">
                <div className="font-medium text-sm">Prognosen</div>
                {forecast.forecast.map((f, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 rounded text-xs">
                    <div className="flex justify-between font-medium mb-1">
                      <span>{f.year}</span>
                      <span>{f.confidence}% Vertrauen</span>
                    </div>
                    <div className="text-slate-600">
                      Nettoertrag: €{f.nettoertrag.toLocaleString('de-DE')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}