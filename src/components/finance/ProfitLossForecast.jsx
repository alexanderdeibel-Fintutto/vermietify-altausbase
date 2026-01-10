import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
          Gewinn & Verlust Prognose
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-xs text-slate-600">Umsatz</p>
            <Badge className="bg-blue-600">{forecast.revenue}€</Badge>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-600">Kosten</p>
            <Badge className="bg-red-600">{forecast.costs}€</Badge>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-600">Gewinn</p>
            <Badge className="bg-green-600">{forecast.profit}€</Badge>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={forecast.timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="profit" stroke="#10b981" fill="#10b98133" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}