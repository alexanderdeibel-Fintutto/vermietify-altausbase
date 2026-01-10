import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Target } from 'lucide-react';

export default function CostCenterAccounting() {
  const { data: costCenters } = useQuery({
    queryKey: ['costCenters'],
    queryFn: async () => {
      const response = await base44.functions.invoke('analyzeCostCenters', {});
      return response.data;
    }
  });

  if (!costCenters) return null;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Kostenstellenrechnung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={costCenters.centers} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
              {costCenters.centers.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-1">
          {costCenters.centers.map((center, idx) => (
            <div key={idx} className="flex justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm">{center.name}</span>
              <Badge>{center.amount}€</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}