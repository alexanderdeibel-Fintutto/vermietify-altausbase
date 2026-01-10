import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function ReturnForecast() {
  const { data: forecast } = useQuery({
    queryKey: ['returnForecast'],
    queryFn: async () => {
      const response = await base44.functions.invoke('forecastReturns', {});
      return response.data;
    }
  });

  if (!forecast) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Rendite-Prognose
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded text-center">
            <p className="text-xs">Erwartete Rendite</p>
            <Badge className="bg-green-600 text-lg">{forecast.expected_return}%</Badge>
          </div>
          <div className="p-3 bg-blue-50 rounded text-center">
            <p className="text-xs">Konfidenz</p>
            <Badge className="bg-blue-600">{forecast.confidence}%</Badge>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={forecast.timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="return" stroke="#10b981" fill="#10b98133" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}