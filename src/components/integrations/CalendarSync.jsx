import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, ExternalLink } from 'lucide-react';

export default function CalendarSync() {
  const { data: events = [] } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getCalendarEvents', {});
      return response.data.events;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Kalender-Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full" variant="outline">
          <ExternalLink className="w-4 h-4 mr-2" />
          Mit Google Calendar verbinden
        </Button>
        {events.map((event, idx) => (
          <div key={idx} className="p-2 bg-blue-50 rounded border-l-4 border-blue-600">
            <p className="text-sm font-semibold">{event.title}</p>
            <p className="text-xs text-slate-600">{new Date(event.date).toLocaleString('de-DE')}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}