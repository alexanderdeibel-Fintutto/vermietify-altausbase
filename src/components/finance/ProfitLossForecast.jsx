import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function ProfitLossForecast() {
  const { data: forecast } = useQuery({
    queryKey: ['profitLoss'],
    queryFn: async () => {
      const response = await base44.functions.invoke('forecastProfitLoss', {});
      return response.data;
    }
  });

  if (!forecast) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Gewinn & Verlust-Prognose
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded text-center">
            <p className="text-xs">Erwarteter Gewinn</p>
            <Badge className="bg-green-600 text-lg">{forecast.expected_profit}€</Badge>
          </div>
          <div className="p-3 bg-blue-50 rounded text-center">
            <p className="text-xs">EBITDA-Marge</p>
            <Badge className="bg-blue-600">{forecast.ebitda_margin}%</Badge>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={forecast.quarterly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="quarter" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill="#10b981" name="Einnahmen" />
            <Bar dataKey="expenses" fill="#ef4444" name="Ausgaben" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}