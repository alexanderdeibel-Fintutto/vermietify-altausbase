import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Gauge } from 'lucide-react';

export default function PerformanceMonitoring() {
  const { data: performance } = useQuery({
    queryKey: ['performance'],
    queryFn: async () => {
      const response = await base44.functions.invoke('monitorPerformance', {});
      return response.data;
    }
  });

  if (!performance) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          Performance-Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-xs">Ladezeit</p>
            <Badge className="bg-green-600">{performance.load_time}ms</Badge>
          </div>
          <div className="text-center">
            <p className="text-xs">API Calls</p>
            <Badge className="bg-blue-600">{performance.api_calls}</Badge>
          </div>
          <div className="text-center">
            <p className="text-xs">Fehlerrate</p>
            <Badge className="bg-green-600">{performance.error_rate}%</Badge>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={performance.timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="response_time" stroke="#3b82f6" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}