import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Repeat, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function RecurringMaintenance({ buildingId }) {
  const queryClient = useQueryClient();

  const templates = [
    { title: 'Heizungswartung', interval: 'quarterly', type: 'maintenance' },
    { title: 'Feuermelder prüfen', interval: 'monthly', type: 'inspection' },
    { title: 'Treppenhaus reinigen', interval: 'weekly', type: 'cleaning' },
    { title: 'Aufzug-Check', interval: 'monthly', type: 'inspection' }
  ];

  const createRecurringMutation = useMutation({
    mutationFn: async (template) => {
      return await base44.entities.BuildingTask.create({
        building_id: buildingId,
        task_title: template.title,
        task_type: template.type,
        is_recurring: true,
        recurrence_pattern: template.interval,
        status: 'open'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentTasks'] });
      toast.success('Wiederkehrende Aufgabe erstellt');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Repeat className="w-4 h-4" />
          Wiederkehrende Wartung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {templates.map((template, idx) => (
          <div key={idx} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
            <div className="flex-1">
              <p className="font-semibold text-sm">{template.title}</p>
              <Badge variant="outline" className="text-xs mt-1">{template.interval}</Badge>
            </div>
            <Button
              size="sm"
              onClick={() => createRecurringMutation.mutate(template)}
              disabled={createRecurringMutation.isPending}
            >
              <Plus className="w-3 h-3 mr-1" />
              Aktivieren
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}