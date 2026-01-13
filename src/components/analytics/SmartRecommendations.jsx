import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function SmartRecommendations({ entityType = 'Invoice' }) {
  const [feedback, setFeedback] = useState({});
  const queryClient = useQueryClient();

  const { data: recommendations } = useQuery({
    queryKey: ['smart-recommendations', entityType],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateSmartRecommendations', {
        entityType: entityType
      });
      return response.data;
    }
  });

  const applyMutation = useMutation({
    mutationFn: async (recommendation) => {
      const response = await base44.functions.invoke('applyRecommendation', {
        entityType: entityType,
        recommendation: recommendation
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('✅ Empfehlung angewendet');
      queryClient.invalidateQueries();
    }
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({ id, helpful }) => {
      await base44.functions.invoke('trackRecommendationFeedback', {
        recommendationId: id,
        helpful: helpful
      });
    }
  });

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-emerald-200 bg-emerald-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          AI Optimierungsvorschläge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className="p-3 bg-white rounded border-l-4 border-l-emerald-500 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{rec.title}</p>
                <p className="text-xs text-slate-600">{rec.description}</p>
              </div>
              <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                {rec.impact}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => applyMutation.mutate(rec)}
                disabled={applyMutation.isPending}
                className="flex-1 gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Anwenden
              </Button>

              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    feedbackMutation.mutate({ id: rec.id, helpful: true });
                    setFeedback({ ...feedback, [rec.id]: 'helpful' });
                  }}
                  className={feedback[rec.id] === 'helpful' ? 'text-emerald-600' : 'text-slate-400'}
                >
                  <ThumbsUp className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    feedbackMutation.mutate({ id: rec.id, helpful: false });
                    setFeedback({ ...feedback, [rec.id]: 'not_helpful' });
                  }}
                  className={feedback[rec.id] === 'not_helpful' ? 'text-red-600' : 'text-slate-400'}
                >
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}