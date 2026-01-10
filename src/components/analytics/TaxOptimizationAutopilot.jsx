import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxOptimizationAutopilot() {
  const [enabled, setEnabled] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: suggestions = [] } = useQuery({
    queryKey: ['autopilotSuggestions'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAutopilotSuggestions', {});
      return response.data.suggestions;
    }
  });

  const applyMutation = useMutation({
    mutationFn: async (suggestionId) => {
      await base44.functions.invoke('applyOptimization', { suggestion_id: suggestionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autopilotSuggestions'] });
      toast.success('Optimierung angewendet');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          Steuer-Autopilot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
          <span className="text-sm font-semibold">Automatische Optimierung</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        {suggestions.map(sug => (
          <div key={sug.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="font-semibold text-sm">{sug.title}</p>
            <p className="text-xs text-slate-600 mt-1">{sug.description}</p>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-green-600">Ersparnis: {sug.savings}€</Badge>
              <Button size="sm" onClick={() => applyMutation.mutate(sug.id)}>
                <Check className="w-4 h-4 mr-1" />
                Anwenden
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}