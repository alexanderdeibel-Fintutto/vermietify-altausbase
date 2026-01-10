import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function IntelligentSuggestions() {
  const { data: suggestions = [] } = useQuery({
    queryKey: ['intelligentSuggestions'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getIntelligentSuggestions', {});
      return response.data.suggestions;
    }
  });

  const applyMutation = useMutation({
    mutationFn: async (suggestionId) => {
      await base44.functions.invoke('applySuggestion', { suggestion_id: suggestionId });
    },
    onSuccess: () => {
      toast.success('Vorschlag angewendet');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Intelligente Vorschläge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map(sug => (
          <div key={sug.id} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <p className="font-semibold text-sm">{sug.title}</p>
            <p className="text-xs text-slate-600 mt-1">{sug.description}</p>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-purple-600">{sug.impact}</Badge>
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