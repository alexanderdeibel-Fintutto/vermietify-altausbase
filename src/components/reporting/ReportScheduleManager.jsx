import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Mail, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ReportScheduleManager({ companyId }) {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    report_type: 'workflow_analytics',
    frequency: 'weekly',
    schedule_day: 'monday',
    schedule_time: '09:00',
    recipients: '',
    include_charts: true,
    include_summary: true,
    include_predictions: false
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['report-schedules', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.ReportSchedule.filter({
        company_id: companyId
      });
      return result;
    }
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('scheduleReportDistribution', {
        company_id: companyId,
        name: formData.name,
        report_type: formData.report_type,
        frequency: formData.frequency,
        schedule_day: formData.schedule_day,
        schedule_time: formData.schedule_time,
        recipients: formData.recipients.split(',').map(r => r.trim()),
        include_charts: formData.include_charts,
        include_summary: formData.include_summary,
        include_predictions: formData.include_predictions
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      setShowDialog(false);
      setFormData({
        name: '',
        report_type: 'workflow_analytics',
        frequency: 'weekly',
        schedule_day: 'monday',
        schedule_time: '09:00',
        recipients: '',
        include_charts: true,
        include_summary: true,
        include_predictions: false
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.ReportSchedule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
    }
  });

  const sendNowMutation = useMutation({
    mutationFn: (scheduleId) =>
      base44.functions.invoke('generateAndSendReport', {
        schedule_id: scheduleId,
        company_id: companyId
      })
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Automatische Berichtverteilung
        </h3>
        <Button
          onClick={() => setShowDialog(true)}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Neuer Zeitplan
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Berichtszeitplan erstellen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Berichtsname</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Wöchentlicher Bericht"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Berichtstyp</label>
              <Select value={formData.report_type} onValueChange={(v) => setFormData({ ...formData, report_type: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workflow_analytics">Workflow-Analysen</SelectItem>
                  <SelectItem value="performance_metrics">Leistungsmetriken</SelectItem>
                  <SelectItem value="approval_bottlenecks">Genehmigungsengpässe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Häufigkeit</label>
                <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                  <SelectTrigger className="mt-1">
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
                <label className="text-sm font-medium">Zeit</label>
                <Input
                  type="time"
                  value={formData.schedule_time}
                  onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Empfänger (kommagetrennt)</label>
              <Input
                value={formData.recipients}
                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                placeholder="email1@example.com, email2@example.com"
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.include_summary}
                  onCheckedChange={(c) => setFormData({ ...formData, include_summary: c })}
                />
                <span className="text-sm">Zusammenfassung einbeziehen</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.include_charts}
                  onCheckedChange={(c) => setFormData({ ...formData, include_charts: c })}
                />
                <span className="text-sm">Charts einbeziehen</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.include_predictions}
                  onCheckedChange={(c) => setFormData({ ...formData, include_predictions: c })}
                />
                <span className="text-sm">Prognosen einbeziehen</span>
              </label>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Abbrechen
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!formData.name || !formData.recipients || createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? 'Erstellt...' : 'Erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedules List */}
      <div className="space-y-2">
        {schedules.length === 0 ? (
          <Card className="bg-slate-50">
            <CardContent className="pt-6 text-center text-slate-500">
              Keine Zeitpläne vorhanden
            </CardContent>
          </Card>
        ) : (
          schedules.map(schedule => (
            <Card key={schedule.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-slate-900">{schedule.name}</h4>
                      {schedule.is_active && (
                        <Badge className="bg-green-100 text-green-700 text-xs">Aktiv</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} um {schedule.schedule_time}
                    </p>
                    <p className="text-xs text-slate-600">
                      {schedule.recipients?.length || 0} Empfänger
                      {schedule.last_sent && (
                        <span> • Zuletzt: {format(new Date(schedule.last_sent), 'dd.MM.yyyy', { locale: de })}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendNowMutation.mutate(schedule.id)}
                      disabled={sendNowMutation.isPending}
                    >
                      Jetzt senden
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(schedule.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}