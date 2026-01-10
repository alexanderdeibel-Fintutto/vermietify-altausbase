import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function GoogleCalendarSync() {
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getCalendarEvents', {});
      return response.data.events;
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('syncCalendarEvents', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success('Kalender synchronisiert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={() => syncMutation.mutate()} className="w-full">
          Synchronisieren
        </Button>
        <div className="space-y-2">
          {events.slice(0, 5).map(event => (
            <div key={event.id} className="p-2 bg-slate-50 rounded">
              <p className="text-sm font-semibold">{event.summary}</p>
              <p className="text-xs text-slate-600">{new Date(event.start).toLocaleString('de-DE')}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}