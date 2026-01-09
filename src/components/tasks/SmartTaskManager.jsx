import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, Calendar, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function SmartTaskManager({ buildingId }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading: loadingSuggestions } = useQuery({
    queryKey: ['recurringTaskSuggestions', buildingId],
    queryFn: async () => {
      const result = await base44.functions.invoke('suggestRecurringTasks', {
        building_id: buildingId
      });
      return result.data.suggestions || [];
    },
    enabled: showSuggestions && !!buildingId
  });

  const createRecurringMutation = useMutation({
    mutationFn: async (suggestion) => {
      const result = await base44.functions.invoke('createRecurringTaskSchedule', {
        building_id: buildingId,
        task_template: {
          title: suggestion.title,
          description: suggestion.description,
          task_type: suggestion.task_type,
          priority: suggestion.priority
        },
        frequency: suggestion.frequency,
        start_date: new Date().toISOString()
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildingTasks'] });
      toast.success('Wiederkehrende Aufgaben erstellt');
    }
  });

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const frequencyLabels = {
    monthly: '📅 Monatlich',
    quarterly: '📆 Quartalsweise',
    'semi-annual': '📊 Halbjährlich',
    annual: '🗓️ Jährlich'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          KI-Aufgabenassistent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showSuggestions ? (
          <Button 
            onClick={() => setShowSuggestions(true)} 
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Wiederkehrende Aufgaben vorschlagen
          </Button>
        ) : (
          <>
            {loadingSuggestions ? (
              <div className="text-center py-8">
                <Sparkles className="w-8 h-8 animate-pulse text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600">KI analysiert Gebäudedaten...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion, idx) => (
                  <Card key={idx} className="bg-slate-50">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{suggestion.title}</h4>
                          <p className="text-sm text-slate-600 mt-1">{suggestion.description}</p>
                        </div>
                        <Badge className={priorityColors[suggestion.priority]}>
                          {suggestion.priority}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mt-3 text-sm">
                        <span className="text-slate-600">
                          {frequencyLabels[suggestion.frequency]}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.task_type}
                        </Badge>
                      </div>

                      <div className="bg-white rounded p-2 mt-3 text-xs text-slate-600 border">
                        <strong>Begründung:</strong> {suggestion.reason}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => createRecurringMutation.mutate(suggestion)}
                        disabled={createRecurringMutation.isPending}
                        className="w-full mt-3 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-2" />
                        Aufgabenplan erstellen
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}