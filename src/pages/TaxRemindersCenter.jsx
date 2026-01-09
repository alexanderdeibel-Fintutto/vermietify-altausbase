import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Calendar } from 'lucide-react';

export default function TaxRemindersCenter() {
  const [country, setCountry] = useState('DE');
  const [reminderType, setReminderType] = useState('quarterly');
  const [sending, setSending] = useState(false);

  const { data: result = {}, isLoading, refetch } = useQuery({
    queryKey: ['taxReminders', country, reminderType],
    queryFn: async () => {
      const response = await base44.functions.invoke('sendTaxReminders', {
        country,
        reminderType
      });
      return response.data || {};
    },
    enabled: false
  });

  const handleSendReminders = async () => {
    setSending(true);
    await refetch();
    setSending(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🔔 Steuererinnerzentrum</h1>
        <p className="text-slate-500 mt-1">Verwalten Sie Ihre Steuererinnerungen</p>
      </div>

      {/* Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Erinnerungen senden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={sending}>
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
              <label className="text-sm font-medium">Erinnerungstyp</label>
              <Select value={reminderType} onValueChange={setReminderType} disabled={sending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarterly">Quartalsweise</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="planning">Jahresplanung</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleSendReminders}
            disabled={sending || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Bell className="w-4 h-4 mr-2" />
            {sending || isLoading ? 'Wird gesendet...' : 'Erinnerungen senden'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Erinnerungen werden versendet...</div>
      ) : result.reminders_sent ? (
        <>
          <Card className="border-green-300 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Erinnerungen versendet</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{result.reminders_sent}</p>
            </CardContent>
          </Card>

          {(result.details?.reminders || []).map((reminder, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm">{reminder.title}</CardTitle>
                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {reminder.deadline}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    reminder.priority === 'critical' ? 'bg-red-100 text-red-800' :
                    reminder.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {reminder.priority}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-slate-700">{reminder.message}</p>
                <div className="bg-slate-50 p-2 rounded text-xs">
                  <p className="text-slate-600">Empfohlene Aktion:</p>
                  <p className="font-medium mt-1">{reminder.action}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Wählen Sie ein Land und einen Erinnerungstyp aus
        </div>
      )}
    </div>
  );
}