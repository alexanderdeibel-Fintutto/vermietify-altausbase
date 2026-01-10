import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap } from 'lucide-react';

export default function MonteCarloSimulator() {
  const simulateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('runMonteCarloSimulation', {});
      return response.data;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Monte-Carlo-Simulation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={() => simulateMutation.mutate()} className="w-full">
          10.000 Szenarien berechnen
        </Button>
        {simulateMutation.data && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-green-50 rounded text-center">
                <p className="text-xs">Best Case</p>
                <Badge className="bg-green-600">{simulateMutation.data.best_case}€</Badge>
              </div>
              <div className="p-2 bg-blue-50 rounded text-center">
                <p className="text-xs">Erwartet</p>
                <Badge className="bg-blue-600">{simulateMutation.data.expected}€</Badge>
              </div>
              <div className="p-2 bg-red-50 rounded text-center">
                <p className="text-xs">Worst Case</p>
                <Badge className="bg-red-600">{simulateMutation.data.worst_case}€</Badge>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={simulateMutation.data.distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="value" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="probability" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}