import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GitCompare } from 'lucide-react';

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
          <GitCompare className="w-5 h-5" />
          Plan vs. Ist
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparison.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="plan" fill="#94a3b8" name="Plan" />
            <Bar dataKey="actual" fill="#3b82f6" name="Ist" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}