import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const REPORT_TYPES = [
  { value: 'financial', label: '📊 Finanzübersicht', includes: ['invoices', 'payments', 'balance'] },
  { value: 'occupancy', label: '🏠 Belegungsstand', includes: ['vacant_units', 'occupied_units', 'contracts'] },
  { value: 'maintenance', label: '🔧 Wartungsstatus', includes: ['open_tasks', 'completed', 'schedule'] },
  { value: 'tenants', label: '👥 Mieter-Report', includes: ['rents_due', 'disputes', 'new_tenants'] }
];

const SCHEDULES = [
  { value: 'daily', label: 'Täglich 08:00 Uhr' },
  { value: 'weekly', label: 'Jeden Montag 09:00 Uhr' },
  { value: 'monthly', label: 'Am 1. des Monats' }
];

export default function ScheduledReportSetup({ open, onOpenChange }) {
  const [reportType, setReportType] = useState('');
  const [recipients, setRecipients] = useState(['']);
  const [schedule, setSchedule] = useState('weekly');
  const [includeChart, setIncludeChart] = useState(true);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const validRecipients = recipients.filter(r => r.trim());
      return base44.entities.ReportSchedule.create({
        report_type: reportType,
        recipients: validRecipients,
        schedule_frequency: schedule,
        include_charts: includeChart,
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['report-schedules']);
      toast.success('📧 Report-Plan erstellt');
      handleReset();
      onOpenChange(false);
    },
    onError: () => toast.error('Fehler beim Erstellen')
  });

  const handleReset = () => {
    setReportType('');
    setRecipients(['']);
    setSchedule('weekly');
    setIncludeChart(true);
  };

  const handleAddRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const handleRemoveRecipient = (idx) => {
    setRecipients(recipients.filter((_, i) => i !== idx));
  };

  const isValid = reportType && recipients.some(r => r.trim());

  const selectedReport = REPORT_TYPES.find(r => r.value === reportType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Geplanten Report erstellen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Report Type */}
          <div>
            <label className="text-sm font-medium">Report-Typ</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Wählen Sie einen Report-Typ" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Report Includes */}
          {selectedReport && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-blue-900 mb-2">Dieser Report enthält:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedReport.includes.map(item => (
                    <Badge key={item} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Häufigkeit
            </label>
            <Select value={schedule} onValueChange={setSchedule}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHEDULES.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipients */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Empfänger
            </label>
            <div className="space-y-2 mt-2">
              {recipients.map((recipient, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="E-Mail-Adresse"
                    value={recipient}
                    onChange={(e) => {
                      const updated = [...recipients];
                      updated[idx] = e.target.value;
                      setRecipients(updated);
                    }}
                  />
                  {recipients.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveRecipient(idx)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddRecipient}
              className="mt-2"
            >
              + Empfänger
            </Button>
          </div>

          {/* Options */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={includeChart}
              onCheckedChange={setIncludeChart}
              id="include-charts"
            />
            <label htmlFor="include-charts" className="text-sm cursor-pointer">
              Grafiken einbeziehen
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!isValid || createMutation.isPending}
            >
              {createMutation.isPending ? 'Erstelle...' : 'Report planen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}