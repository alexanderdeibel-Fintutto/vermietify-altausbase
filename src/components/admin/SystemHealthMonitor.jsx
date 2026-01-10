import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity, CheckCircle } from 'lucide-react';

export default function SystemHealthMonitor() {
  const { data: health } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: async () => {
      const response = await base44.functions.invoke('checkSystemHealth', {});
      return response.data;
    },
    refetchInterval: 30000
  });

  if (!health) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          System-Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Status</span>
          <Badge className="bg-green-600">Gesund</Badge>
        </div>
        {health.metrics.map((metric, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-xs mb-1">
              <span>{metric.name}</span>
              <span>{metric.value}%</span>
            </div>
            <Progress value={metric.value} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}