import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Clock } from 'lucide-react';

export default function AutomatedReminderFlow() {
  const { data: reminders = [] } = useQuery({
    queryKey: ['pendingReminders'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getPendingReminders', {});
      return response.data.reminders;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Automatische Mahnungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {reminders.map(reminder => (
          <div key={reminder.id} className="p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{reminder.tenant_name}</p>
                <p className="text-xs text-slate-600">{reminder.message}</p>
              </div>
              <div className="text-right">
                <Badge className="bg-orange-600">Stufe {reminder.level}</Badge>
                <p className="text-xs text-slate-500 mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {reminder.days_overdue} Tage
                </p>
              </div>
            </div>
          </div>
        ))}
        {reminders.length === 0 && (
          <p className="text-sm text-slate-600 text-center py-4">Keine ausstehenden Mahnungen</p>
        )}
      </CardContent>
    </Card>
  );
}