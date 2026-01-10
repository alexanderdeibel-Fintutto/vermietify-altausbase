import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin } from 'lucide-react';

export default function RegionalMarketAnalysis() {
  const { data: analysis } = useQuery({
    queryKey: ['marketAnalysis'],
    queryFn: async () => {
      const response = await base44.functions.invoke('analyzeRegionalMarket', {});
      return response.data;
    }
  });

  if (!analysis) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Marktanalyse Regional
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-blue-50 rounded text-center">
            <p className="text-xs">Durchschn. Miete</p>
            <Badge className="bg-blue-600">{analysis.avg_rent}€/m²</Badge>
          </div>
          <div className="p-2 bg-green-50 rounded text-center">
            <p className="text-xs">Trend</p>
            <Badge className="bg-green-600">+{analysis.trend}%</Badge>
          </div>
          <div className="p-2 bg-purple-50 rounded text-center">
            <p className="text-xs">Leerstand</p>
            <Badge className="bg-purple-600">{analysis.vacancy_rate}%</Badge>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={analysis.history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}