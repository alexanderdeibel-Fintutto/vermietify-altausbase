import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function DamageReportForm() {
  const [report, setReport] = useState({ title: '', description: '', severity: 'medium' });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('submitDamageReport', report);
    },
    onSuccess: () => {
      toast.success('Schadensmeldung eingereicht');
      setReport({ title: '', description: '', severity: 'medium' });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Schadensmeldung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Titel"
          value={report.title}
          onChange={(e) => setReport({ ...report, title: e.target.value })}
        />
        <Textarea
          placeholder="Beschreibung des Schadens"
          value={report.description}
          onChange={(e) => setReport({ ...report, description: e.target.value })}
        />
        <Button onClick={() => submitMutation.mutate()} className="w-full">
          <Send className="w-4 h-4 mr-2" />
          Meldung absenden
        </Button>
      </CardContent>
    </Card>
  );
}