import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportScheduler({ reportType }) {
  const [schedule, setSchedule] = useState({
    frequency: 'daily',
    time: '08:00',
    recipients: '',
    format: 'pdf',
    enabled: true
  });
  const queryClient = useQueryClient();

  const createScheduleMutation = useMutation({
    mutationFn: async () => {
      // This would create a scheduled task
      return await base44.functions.invoke('createScheduledReport', {
        reportType,
        ...schedule,
        recipients: schedule.recipients.split(',').map(e => e.trim())
      });
    },
    onSuccess: () => {
      toast.success('Report-Schedule erstellt');
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Automatische Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Frequenz</label>
          <Select value={schedule.frequency} onValueChange={(val) => setSchedule({...schedule, frequency: val})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Täglich</SelectItem>
              <SelectItem value="weekly">Wöchentlich</SelectItem>
              <SelectItem value="monthly">Monatlich</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Uhrzeit
          </label>
          <Input
            type="time"
            value={schedule.time}
            onChange={(e) => setSchedule({...schedule, time: e.target.value})}
          />
        </div>

        <div>
          <label className="text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4" />
            E-Mail Empfänger (kommagetrennt)
          </label>
          <Input
            placeholder="admin@example.com, user@example.com"
            value={schedule.recipients}
            onChange={(e) => setSchedule({...schedule, recipients: e.target.value})}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Format</label>
          <Select value={schedule.format} onValueChange={(val) => setSchedule({...schedule, format: val})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel/CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={schedule.enabled}
            onCheckedChange={(checked) => setSchedule({...schedule, enabled: checked})}
          />
          <label className="text-sm">Automatische Zusendung aktivieren</label>
        </div>

        <Button 
          onClick={() => createScheduleMutation.mutate()}
          disabled={createScheduleMutation.isPending || !schedule.recipients}
          className="w-full"
        >
          Schedule erstellen
        </Button>
      </CardContent>
    </Card>
  );
}