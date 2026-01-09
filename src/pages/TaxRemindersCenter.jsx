import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, CheckCircle2, Clock } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxRemindersCenter() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [filterStatus, setFilterStatus] = useState('pending');
  const queryClient = useQueryClient();

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['taxReminders', country, taxYear, filterStatus],
    queryFn: () => base44.entities.TaxReminder.filter({
      country,
      tax_year: taxYear,
      status: filterStatus
    }).catch(() => [])
  });

  const updateReminderMutation = useMutation({
    mutationFn: (params) => base44.entities.TaxReminder.update(params.id, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxReminders'] });
    }
  });

  const handleMarkRead = (reminder) => {
    updateReminderMutation.mutate({
      id: reminder.id,
      data: { status: 'read', read_at: new Date().toISOString() }
    });
  };

  const handleDismiss = (reminder) => {
    updateReminderMutation.mutate({
      id: reminder.id,
      data: { status: 'dismissed' }
    });
  };

  const handleSnooze = (reminder) => {
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + 3);
    updateReminderMutation.mutate({
      id: reminder.id,
      data: { snoozed_until: snoozeDate.toISOString().split('T')[0] }
    });
  };

  const statusCounts = {
    pending: reminders.filter(r => r.status === 'pending').length,
    read: reminders.filter(r => r.status === 'read').length,
    dismissed: reminders.filter(r => r.status === 'dismissed').length
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-800';
      case 'read':
        return 'bg-blue-100 text-blue-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🔔 Steuererinnerungen</h1>
        <p className="text-slate-500 mt-1">Verwalten Sie alle Steuertermins und Erinnerungen</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
              <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
              <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR + 1)}>{CURRENT_YEAR + 1}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Ausstehend ({statusCounts.pending})</SelectItem>
              <SelectItem value="read">Gelesen ({statusCounts.read})</SelectItem>
              <SelectItem value="dismissed">Verworfen ({statusCounts.dismissed})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-600">Ausstehend</p>
                <p className="text-2xl font-bold mt-2">{statusCounts.pending}</p>
              </div>
              <Clock className="w-5 h-5 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-600">Gelesen</p>
                <p className="text-2xl font-bold mt-2">{statusCounts.read}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-600">Gesamt</p>
                <p className="text-2xl font-bold mt-2">{reminders.length}</p>
              </div>
              <Bell className="w-5 h-5 text-slate-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reminders List */}
      {isLoading ? (
        <div className="text-center py-8">⏳ Erinnerungen werden geladen...</div>
      ) : reminders.length === 0 ? (
        <Card className="bg-slate-50">
          <CardContent className="pt-6 text-center text-slate-500 py-8">
            Keine {filterStatus === 'pending' ? 'ausstehenden' : filterStatus} Erinnerungen
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reminders.map(reminder => (
            <Card key={reminder.id} className={reminder.status === 'pending' ? 'border-red-300 bg-red-50' : ''}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold">{reminder.title}</h3>
                      <Badge className={getStatusColor(reminder.status)}>
                        {reminder.status === 'pending' ? 'Ausstehend' : reminder.status === 'read' ? 'Gelesen' : 'Verworfen'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{reminder.message}</p>
                    <div className="flex gap-2 text-xs text-slate-500">
                      {reminder.scheduled_date && (
                        <span>📅 {new Date(reminder.scheduled_date).toLocaleDateString('de-DE')}</span>
                      )}
                      {reminder.related_deadline && (
                        <span>⏰ Termin: {new Date(reminder.related_deadline).toLocaleDateString('de-DE')}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {reminder.status === 'pending' && (
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkRead(reminder)}
                        disabled={updateReminderMutation.isPending}
                      >
                        ✓ Gelesen
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSnooze(reminder)}
                        disabled={updateReminderMutation.isPending}
                      >
                        ⏱️ 3T
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismiss(reminder)}
                        disabled={updateReminderMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        ✕ Verwerfen
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}