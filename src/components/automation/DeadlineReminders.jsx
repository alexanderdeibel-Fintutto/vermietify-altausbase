import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function DeadlineReminders() {
  const queryClient = useQueryClient();

  const { data: reminders = [] } = useQuery({
    queryKey: ['deadlineReminders'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getDeadlineReminders', {});
      return response.data.reminders;
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }) => {
      await base44.functions.invoke('toggleReminder', { reminder_id: id, enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlineReminders'] });
      toast.success('Erinnerung aktualisiert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Frist-Erinnerungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reminders.map(reminder => (
          <div key={reminder.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-sm">{reminder.title}</p>
                <p className="text-xs text-slate-600">{reminder.due_date}</p>
              </div>
            </div>
            <Switch
              checked={reminder.enabled}
              onCheckedChange={(checked) => toggleMutation.mutate({ id: reminder.id, enabled: checked })}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}