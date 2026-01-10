import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function ViewingScheduler() {
  const [date, setDate] = useState();

  const bookMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('bookViewing', { date });
    },
    onSuccess: () => {
      toast.success('Besichtigungstermin gebucht');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Besichtigung buchen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Calendar mode="single" selected={date} onSelect={setDate} />
        <Button onClick={() => bookMutation.mutate()} disabled={!date} className="w-full">
          Termin buchen
        </Button>
      </CardContent>
    </Card>
  );
}