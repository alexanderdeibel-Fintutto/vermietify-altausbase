import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function PredictiveAnalytics() {
  const { data: predictions } = useQuery({
    queryKey: ['predictions'],
    queryFn: async () => {
      const response = await base44.functions.invoke('generatePredictions', {});
      return response.data;
    }
  });

  if (!predictions) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          KI-Vorhersagen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-blue-50 rounded text-center">
            <p className="text-xs">Cashflow Q2</p>
            <Badge className="bg-blue-600">{predictions.cashflow_q2}€</Badge>
          </div>
          <div className="p-2 bg-green-50 rounded text-center">
            <p className="text-xs">Rendite 2026</p>
            <Badge className="bg-green-600">{predictions.return_2026}%</Badge>
          </div>
          <div className="p-2 bg-purple-50 rounded text-center">
            <p className="text-xs">Konfidenz</p>
            <Badge className="bg-purple-600">{predictions.confidence}%</Badge>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={predictions.timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="actual" stroke="#10b981" strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}