import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Brain, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function SmartCategorizationEngine() {
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['categorizationStats'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getCategorizationStats', {});
      return response.data;
    }
  });

  const trainMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('trainCategorizationModel', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorizationStats'] });
      toast.success('Modell trainiert');
    }
  });

  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          KI-Kategorisierung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-slate-600">Genauigkeit</p>
          <Progress value={stats.accuracy} className="mt-2" />
          <Badge className="mt-2 bg-blue-600">{stats.accuracy}%</Badge>
        </div>
        <div className="text-xs text-slate-600 space-y-1">
          <p>• Verarbeitete Transaktionen: {stats.processed}</p>
          <p>• Korrekturen: {stats.corrections}</p>
          <p>• Gelernte Muster: {stats.patterns}</p>
        </div>
        <Button onClick={() => trainMutation.mutate()} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Modell neu trainieren
        </Button>
      </CardContent>
    </Card>
  );
}