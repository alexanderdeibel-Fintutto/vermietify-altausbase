import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxRemindersCenter() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [activeTab, setActiveTab] = useState('pending');
  const queryClient = useQueryClient();

  // Fetch reminders
  const { data: reminders = [] } = useQuery({
    queryKey: ['taxReminders', country, taxYear],
    queryFn: async () => {
      return await base44.entities.TaxReminder.filter(
        { country, tax_year: taxYear },
        '-scheduled_date'
      ) || [];
    }
  });

  // Mark as read mutation
  const { mutate: markAsRead } = useMutation({
    mutationFn: (reminderId) =>
      base44.entities.TaxReminder.update(reminderId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxReminders'] });
    }
  });

  // Mark as resolved mutation
  const { mutate: markAsResolved } = useMutation({
    mutationFn: (reminderId) =>
      base44.entities.TaxReminder.update(reminderId, { status: 'dismissed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxReminders'] });
    }
  });

  const pendingReminders = reminders.filter(r => r.status === 'pending');
  const readReminders = reminders.filter(r => r.is_read && r.status === 'pending');
  const dismissedReminders = reminders.filter(r => r.status === 'dismissed');

  const getReminderIcon = (type) => {
    switch (type) {
      case 'deadline_1_week':
        return '⏰';
      case 'deadline_3_days':
        return '🔴';
      case 'document_collection_start':
        return '📄';
      case 'calculation_needed':
        return '🧮';
      case 'filing_ready':
        return '📤';
      default:
        return '📌';
    }
  };

  const getReminderColor = (type) => {
    switch (type) {
      case 'deadline_3_days':
      case 'deadline_1_week':
        return 'border-red-300 bg-red-50';
      case 'document_collection_start':
        return 'border-yellow-300 bg-yellow-50';
      case 'calculation_needed':
        return 'border-orange-300 bg-orange-50';
      case 'filing_ready':
        return 'border-blue-300 bg-blue-50';
      default:
        return 'border-slate-300 bg-slate-50';
    }
  };

  const ReminderCard = ({ reminder }) => (
    <Card className={`border-l-4 ${getReminderColor(reminder.reminder_type)}`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getReminderIcon(reminder.reminder_type)}</span>
              <h3 className="font-semibold">{reminder.title}</h3>
              {!reminder.is_read && (
                <Badge className="bg-blue-100 text-blue-800">Neu</Badge>
              )}
            </div>
            <p className="text-sm text-slate-700">{reminder.message}</p>
            {reminder.related_deadline && (
              <p className="text-xs text-slate-500 mt-2">
                Deadline: {new Date(reminder.related_deadline).toLocaleDateString('de-DE')}
              </p>
            )}
            <div className="flex gap-1 flex-wrap mt-3">
              {reminder.notification_channels?.map(channel => (
                <Badge key={channel} variant="outline" className="text-xs">
                  {channel === 'email' && '📧'}
                  {channel === 'sms' && '📱'}
                  {channel === 'push' && '🔔'}
                  {channel === 'in_app' && '💬'}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {!reminder.is_read && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => markAsRead(reminder.id)}
              >
                ✓ Lesen
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAsResolved(reminder.id)}
            >
              ✓ Erledigt
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🔔 Steuererinnerungen</h1>
        <p className="text-slate-500 mt-1">Verwalten Sie Ihre Steuer-Deadlines und Aufgaben</p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 flex-wrap">
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
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Bell className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{pendingReminders.length}</p>
            <p className="text-sm text-slate-600 mt-1">Ausstehend</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{readReminders.length}</p>
            <p className="text-sm text-slate-600 mt-1">Gelesen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{dismissedReminders.length}</p>
            <p className="text-sm text-slate-600 mt-1">Erledigt</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            <Bell className="w-4 h-4 mr-2" /> Ausstehend ({pendingReminders.length})
          </TabsTrigger>
          <TabsTrigger value="read">
            <Clock className="w-4 h-4 mr-2" /> Gelesen ({readReminders.length})
          </TabsTrigger>
          <TabsTrigger value="dismissed">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Erledigt ({dismissedReminders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pendingReminders.filter(r => !r.is_read).length === 0 ? (
            <Card className="text-center py-8 text-slate-500">
              Keine ausstehenden Erinnerungen
            </Card>
          ) : (
            pendingReminders
              .filter(r => !r.is_read)
              .map(reminder => (
                <ReminderCard key={reminder.id} reminder={reminder} />
              ))
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-3 mt-4">
          {readReminders.length === 0 ? (
            <Card className="text-center py-8 text-slate-500">
              Keine gelesenen Erinnerungen
            </Card>
          ) : (
            readReminders.map(reminder => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))
          )}
        </TabsContent>

        <TabsContent value="dismissed" className="space-y-3 mt-4">
          {dismissedReminders.length === 0 ? (
            <Card className="text-center py-8 text-slate-500">
              Keine erledigten Erinnerungen
            </Card>
          ) : (
            dismissedReminders.map(reminder => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">💡 Tipps</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-slate-700">
          <p>✓ Überprüfen Sie regelmäßig Ihre Erinnerungen</p>
          <p>✓ Markieren Sie erledigte Aufgaben als "Erledigt"</p>
          <p>✓ Aktivieren Sie E-Mail-Benachrichtigungen in den Einstellungen</p>
          <p>✓ Dokumentieren Sie den Status jeder Aufgabe</p>
        </CardContent>
      </Card>
    </div>
  );
}