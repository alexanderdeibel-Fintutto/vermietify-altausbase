import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const CURRENT_YEAR = new Date().getFullYear();
const COUNTRIES = { DE: '🇩🇪 Deutschland', AT: '🇦🇹 Österreich', CH: '🇨🇭 Schweiz' };

export default function TaxDeadlines() {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const queryClient = useQueryClient();

  const { data: deadlines = [] } = useQuery({
    queryKey: ['taxDeadlines', selectedCountry, selectedYear],
    queryFn: async () => {
      let query = { tax_year: selectedYear };
      if (selectedCountry) query.country = selectedCountry;
      return await base44.entities.TaxDeadline.filter(query, '-deadline_date', 100) || [];
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.TaxDeadline.update(data.id, { status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxDeadlines'] });
      toast.success('Status aktualisiert');
    }
  });

  const sendRemindersMutation = useMutation({
    mutationFn: () => base44.functions.invoke('sendTaxReminders', {}),
    onSuccess: (data) => {
      toast.success(`${data.remindersSent} Erinnerungen gesendet`);
      queryClient.invalidateQueries({ queryKey: ['taxDeadlines'] });
    }
  });

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      in_progress: '🔄',
      completed: '✅',
      overdue: '❌'
    };
    return icons[status] || '•';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-slate-100 text-slate-800';
  };

  const getDaysUntil = (date) => {
    const d = Math.floor((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    return d;
  };

  const getUrgency = (days) => {
    if (days < 0) return { label: 'Überfällig', color: 'text-red-600' };
    if (days === 0) return { label: 'Heute!', color: 'text-red-600' };
    if (days <= 7) return { label: `${days}d`, color: 'text-red-600' };
    if (days <= 14) return { label: `${days}d`, color: 'text-orange-600' };
    return { label: `${days}d`, color: 'text-green-600' };
  };

  const sortedDeadlines = [...deadlines].sort((a, b) => 
    new Date(a.deadline_date) - new Date(b.deadline_date)
  );

  const upcoming = sortedDeadlines.filter(d => getDaysUntil(d.deadline_date) >= 0);
  const overdue = sortedDeadlines.filter(d => getDaysUntil(d.deadline_date) < 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">📅 Steuerterminte {selectedYear}</h1>
        <Button onClick={() => sendRemindersMutation.mutate()} className="gap-2">
          🔔 Erinnerungen senden
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Alle Länder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Alle Länder</SelectItem>
            {Object.entries(COUNTRIES).map(([code, name]) => (
              <SelectItem key={code} value={code}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2025, 2026, 2027].map(year => (
              <SelectItem key={year} value={String(year)}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overdue Alerts */}
      {overdue.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-red-600 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Überfällige Termine ({overdue.length})
          </h3>
          {overdue.map(deadline => (
            <Card key={deadline.id} className="border-red-300 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-bold">{deadline.title}</p>
                    <p className="text-sm text-slate-600">{COUNTRIES[deadline.country]}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-lg font-bold text-red-600">❌ Überfällig</p>
                    <p className="text-xs text-slate-500">{deadline.deadline_date}</p>
                  </div>
                  <Select value={deadline.status} onValueChange={(status) => updateMutation.mutate({ id: deadline.id, status })}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Offen</SelectItem>
                      <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                      <SelectItem value="completed">Abgeschlossen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upcoming Deadlines */}
      <div>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> Bevorstehende Termine ({upcoming.length})
        </h3>
        <div className="space-y-2">
          {upcoming.map(deadline => {
            const daysUntil = getDaysUntil(deadline.deadline_date);
            const urgency = getUrgency(daysUntil);
            return (
              <Card key={deadline.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{getStatusIcon(deadline.status)}</span>
                      <div>
                        <p className="font-bold">{deadline.title}</p>
                        <p className="text-sm text-slate-600">{deadline.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getPriorityColor(deadline.priority)}>
                            {deadline.priority}
                          </Badge>
                          <Badge variant="outline">{COUNTRIES[deadline.country]}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <p className={`text-2xl font-bold ${urgency.color}`}>{urgency.label}</p>
                      <p className="text-xs text-slate-500">{deadline.deadline_date}</p>
                    </div>
                    <Select value={deadline.status} onValueChange={(status) => updateMutation.mutate({ id: deadline.id, status })}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Offen</SelectItem>
                        <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                        <SelectItem value="completed">Abgeschlossen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {deadlines.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-slate-500">Keine Termine für diesen Zeitraum</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}