import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function PlanVsActualComparison() {
  const { data: comparison } = useQuery({
    queryKey: ['planVsActual'],
    queryFn: async () => {
      const response = await base44.functions.invoke('comparePlanVsActual', {});
      return response.data;
    }
  });

  if (!comparison) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Plan-vs-Ist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={comparison.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="planned" fill="#94a3b8" name="Geplant" />
            <Bar dataKey="actual" fill="#3b82f6" name="Ist" />
          </BarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 bg-slate-50 rounded text-center">
            <p className="text-xs">Abweichung</p>
            <Badge className={comparison.variance > 0 ? 'bg-red-600' : 'bg-green-600'}>
              {comparison.variance > 0 ? '+' : ''}{comparison.variance}%
            </Badge>
          </div>
          <div className="p-2 bg-slate-50 rounded text-center">
            <p className="text-xs">Zielerreichung</p>
            <Badge className="bg-blue-600">{comparison.achievement}%</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}