import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoCategorizationSettings() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['autoCategorizationSettings'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAutoCategorizationSettings', {});
      return response.data;
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled) => {
      await base44.functions.invoke('toggleAutoCategorization', { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autoCategorizationSettings'] });
      toast.success('Einstellung gespeichert');
    }
  });

  if (!settings) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Auto-Kategorisierung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Aktiviert</span>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => toggleMutation.mutate(checked)}
          />
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">KI-Genauigkeit</p>
          <Progress value={settings.accuracy * 100} />
          <p className="text-xs text-slate-600 mt-1">{(settings.accuracy * 100).toFixed(0)}%</p>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-900">
            {settings.processed_count} Transaktionen automatisch kategorisiert
          </p>
        </div>
      </CardContent>
    </Card>
  );
}