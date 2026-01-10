import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function AutomatedReminderFlow() {
  const queryClient = useQueryClient();

  const { data: reminders = [] } = useQuery({
    queryKey: ['pendingReminders'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getPendingReminders', {});
      return response.data.reminders;
    }
  });

  const sendMutation = useMutation({
    mutationFn: async (reminderId) => {
      await base44.functions.invoke('sendPaymentReminder', { reminder_id: reminderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingReminders'] });
      toast.success('Mahnung versendet');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Automatische Mahnläufe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {reminders.map(rem => (
          <div key={rem.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div>
              <p className="font-semibold text-sm">{rem.tenant_name}</p>
              <p className="text-xs text-slate-600">Offen: {rem.amount}€ | Fällig seit: {rem.overdue_days} Tagen</p>
              <Badge className="mt-1 bg-red-600">{rem.reminder_level}. Mahnung</Badge>
            </div>
            <Button size="sm" onClick={() => sendMutation.mutate(rem.id)}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}