import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Trash2, Check, Clock, Calendar, Mail, Smartphone } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxRemindersCenter() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  // Fetch reminders
  const { data: reminders = [] } = useQuery({
    queryKey: ['taxReminders', country, taxYear],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.TaxReminder.filter({
        user_email: user.email,
        country,
        tax_year: taxYear
      }) || [];
    }
  });

  // Mark as read
  const readMutation = useMutation({
    mutationFn: (id) => base44.entities.TaxReminder.update(id, { status: 'read' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taxReminders'] })
  });

  // Snooze reminder
  const snoozeMutation = useMutation({
    mutationFn: (id) => {
      const snoozeDate = new Date();
      snoozeDate.setDate(snoozeDate.getDate() + 3);
      return base44.entities.TaxReminder.update(id, {
        status: 'snoozed',
        snoozed_until: snoozeDate.toISOString().split('T')[0]
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taxReminders'] })
  });

  // Delete reminder
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TaxReminder.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taxReminders'] })
  });

  const filteredReminders = reminders.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const pendingCount = reminders.filter(r => r.status === 'pending').length;
  const readCount = reminders.filter(r => r.status === 'read').length;
  const snoozedCount = reminders.filter(r => r.status === 'snoozed').length;

  const statusIcons = {
    pending: <Bell className="w-5 h-5 text-orange-500" />,
    sent: <Mail className="w-5 h-5 text-blue-500" />,
    read: <Check className="w-5 h-5 text-green-600" />,
    snoozed: <Clock className="w-5 h-5 text-slate-500" />,
    dismissed: <Trash2 className="w-5 h-5 text-slate-400" />
  };

  const reminderTypeEmojis = {
    deadline_1_week: '📅',
    deadline_3_days: '⏰',
    deadline_1_day: '🚨',
    document_collection_start: '📁',
    calculation_needed: '🧮',
    filing_ready: '✅',
    annual_review: '📊'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🔔 Tax Reminders Center</h1>
        <p className="text-slate-500 mt-1">Verwalten Sie alle Ihre Steuererinnerungen und Aufgaben</p>
      </div>

      {/* Country & Year Selection */}
      <div className="flex gap-4">
        <div className="flex-1 max-w-xs">
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

        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={taxYear.toString()} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Bell className="w-6 h-6 text-orange-500 mx-auto mb-1" />
            <p className="text-sm text-slate-600">Ausstehend</p>
            <p className="text-3xl font-bold text-orange-500">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Mail className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <p className="text-sm text-slate-600">Versendet</p>
            <p className="text-3xl font-bold text-blue-500">{reminders.filter(r => r.status === 'sent').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Check className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-sm text-slate-600">Gelesen</p>
            <p className="text-3xl font-bold text-green-600">{readCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="w-6 h-6 text-slate-500 mx-auto mb-1" />
            <p className="text-sm text-slate-600">Schlummert</p>
            <p className="text-3xl font-bold text-slate-500">{snoozedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs defaultValue="all" onValueChange={setFilterStatus} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Alle ({reminders.length})</TabsTrigger>
          <TabsTrigger value="pending">Ausstehend ({pendingCount})</TabsTrigger>
          <TabsTrigger value="sent">Versendet</TabsTrigger>
          <TabsTrigger value="read">Gelesen ({readCount})</TabsTrigger>
          <TabsTrigger value="snoozed">Schlummert ({snoozedCount})</TabsTrigger>
        </TabsList>

        {/* Reminders List */}
        <TabsContent value={filterStatus} className="space-y-3 mt-4">
          {filteredReminders.length > 0 ? (
            filteredReminders
              .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
              .map(reminder => (
                <Card
                  key={reminder.id}
                  className={
                    reminder.status === 'pending'
                      ? 'border-orange-300 bg-orange-50'
                      : reminder.status === 'snoozed'
                      ? 'border-slate-300 bg-slate-50'
                      : ''
                  }
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-2xl mt-1">
                          {reminderTypeEmojis[reminder.reminder_type] || '📌'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{reminder.title}</h4>
                            <Badge
                              className={
                                reminder.status === 'pending'
                                  ? 'bg-orange-100 text-orange-800'
                                  : reminder.status === 'read'
                                  ? 'bg-green-100 text-green-800'
                                  : reminder.status === 'snoozed'
                                  ? 'bg-slate-100 text-slate-800'
                                  : 'bg-blue-100 text-blue-800'
                              }
                            >
                              {reminder.status}
                            </Badge>
                          </div>

                          <p className="text-sm text-slate-600 mb-2">{reminder.message}</p>

                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Termin: {new Date(reminder.scheduled_date).toLocaleDateString('de-DE')}
                            </div>
                            {reminder.related_deadline && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Deadline: {new Date(reminder.related_deadline).toLocaleDateString('de-DE')}
                              </div>
                            )}
                          </div>

                          {reminder.notification_channels && (
                            <div className="flex gap-2 mt-3">
                              {reminder.notification_channels.includes('email') && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <Mail className="w-3 h-3" /> Email
                                </Badge>
                              )}
                              {reminder.notification_channels.includes('push') && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <Smartphone className="w-3 h-3" /> Push
                                </Badge>
                              )}
                              {reminder.notification_channels.includes('in_app') && (
                                <Badge variant="outline" className="text-xs">
                                  In-App
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {reminder.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 gap-1"
                              onClick={() => readMutation.mutate(reminder.id)}
                            >
                              <Check className="w-4 h-4" /> Lesen
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => snoozeMutation.mutate(reminder.id)}
                            >
                              <Clock className="w-4 h-4" /> Schlummern
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deleteMutation.mutate(reminder.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : (
            <Card className="text-center py-8 text-slate-500">
              Keine Erinnerungen für diese Filter
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Notification Settings Card */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" /> Benachrichtigungseinstellungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            💡 Aktivieren Sie mehrere Kanäle, um sicherzustellen, dass Sie keine wichtigen Deadlines verpassen:
          </p>
          <ul className="text-sm space-y-2 text-slate-700">
            <li>✅ Email - für detaillierte Mitteilungen</li>
            <li>✅ Push Notifications - für schnelle Benachrichtigungen</li>
            <li>✅ In-App - für Übersichtlichkeit im System</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}