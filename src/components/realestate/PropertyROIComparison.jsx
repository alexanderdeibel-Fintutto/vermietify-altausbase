import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function PropertyROIComparison() {
  const { data: comparison } = useQuery({
    queryKey: ['propertyROI'],
    queryFn: async () => {
      const response = await base44.functions.invoke('comparePropertyROI', {});
      return response.data;
    }
  });

  if (!comparison) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Immobilien-ROI-Vergleich
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparison.properties}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="roi" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
        <div className="space-y-1">
          {comparison.properties.slice(0, 5).map(prop => (
            <div key={prop.id} className="flex justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm">{prop.name}</span>
              <Badge className={prop.roi > 5 ? 'bg-green-600' : 'bg-orange-600'}>
                {prop.roi}% ROI
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}