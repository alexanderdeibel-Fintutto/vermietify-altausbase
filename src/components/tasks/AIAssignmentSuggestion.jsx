import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, User, TrendingUp, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AIAssignmentSuggestion({ taskId, buildingId, onAssign }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const getSuggestions = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('suggestTaskAssignment', {
        task_id: taskId,
        building_id: buildingId
      });
      setSuggestions(result.data);
    } catch (error) {
      toast.error('Fehler bei KI-Analyse');
    } finally {
      setLoading(false);
    }
  };

  const assignMutation = useMutation({
    mutationFn: async (managerEmail) => {
      return await base44.entities.BuildingTask.update(taskId, {
        assigned_to: managerEmail,
        status: 'assigned'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['buildingTasks'] });
      toast.success('Aufgabe zugewiesen');
      if (onAssign) onAssign();
    }
  });

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-slate-600';
  };

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          KI-Zuweisungsvorschläge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!suggestions ? (
          <Button 
            onClick={getSuggestions} 
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                KI analysiert...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Vorschläge generieren
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Basierend auf Fähigkeiten und aktueller Auslastung:
            </p>
            
            {suggestions.recommendations?.map((rec, idx) => (
              <Card key={idx} className="bg-gradient-to-br from-white to-slate-50">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{rec.manager_name}</p>
                        <p className={`text-xs font-semibold ${getScoreColor(rec.score)}`}>
                          Score: {rec.score}/100
                        </p>
                      </div>
                    </div>
                    {idx === 0 && (
                      <Badge className="bg-purple-100 text-purple-800">
                        Top-Wahl
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-3">{rec.reason}</p>
                  
                  <Button
                    size="sm"
                    onClick={() => assignMutation.mutate(rec.manager_email)}
                    disabled={assignMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <CheckCircle className="w-3 h-3 mr-2" />
                    Zuweisen
                  </Button>
                </CardContent>
              </Card>
            ))}

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSuggestions(null)}
              className="w-full"
            >
              Neue Vorschläge
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}