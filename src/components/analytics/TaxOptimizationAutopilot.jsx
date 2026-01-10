import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxOptimizationAutopilot() {
  const queryClient = useQueryClient();

  const { data: suggestions } = useQuery({
    queryKey: ['autopilotSuggestions'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAutopilotSuggestions', {});
      return response.data;
    }
  });

  const applyMutation = useMutation({
    mutationFn: async (suggestionId) => {
      await base44.functions.invoke('applyOptimization', { suggestion_id: suggestionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Optimierung angewendet');
    }
  });

  if (!suggestions) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Steuer-Autopilot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 bg-purple-50 rounded-lg text-center">
          <p className="text-sm font-semibold">Potenzielle Ersparnis</p>
          <Badge className="bg-purple-600 text-2xl">{suggestions.potential_savings}€</Badge>
        </div>
        {suggestions.optimizations.map(opt => (
          <div key={opt.id} className="p-3 bg-slate-50 rounded-lg">
            <p className="font-semibold text-sm">{opt.title}</p>
            <p className="text-xs text-slate-600 mt-1">{opt.description}</p>
            <div className="flex justify-between items-center mt-2">
              <Badge className="bg-green-600">+{opt.savings}€</Badge>
              <Button size="sm" onClick={() => applyMutation.mutate(opt.id)}>
                <Play className="w-4 h-4 mr-1" />
                Anwenden
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}