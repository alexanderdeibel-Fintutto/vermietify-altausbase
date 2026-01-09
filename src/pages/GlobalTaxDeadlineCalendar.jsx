import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function GlobalTaxDeadlineCalendar() {
  const [country, setCountry] = useState('DE');
  const [year, setYear] = useState(2026);

  const { data: deadlines = [], isLoading } = useQuery({
    queryKey: ['globalTaxDeadlines', country],
    queryFn: async () => {
      const results = await base44.entities.TaxDeadline.filter({ country });
      return results || [];
    }
  });

  const sortedDeadlines = [...deadlines].sort((a, b) => 
    new Date(a.deadline_date) - new Date(b.deadline_date)
  );

  const upcomingDeadlines = sortedDeadlines.filter(d => {
    const deadlineDate = new Date(d.deadline_date);
    return deadlineDate.getFullYear() === year;
  });

  const getPriorityColor = (priority) => {
    if (priority === 'critical') return 'bg-red-100 text-red-800';
    if (priority === 'high') return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getDaysUntilDeadline = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diff = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📅 Globaler Steuer-Terminkalender</h1>
        <p className="text-slate-500 mt-1">Alle wichtigen Steuerterminen im Überblick</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <label className="text-sm font-medium">Jahr</label>
          <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2025, 2026, 2027].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Termine werden geladen...</div>
      ) : upcomingDeadlines.length > 0 ? (
        <div className="space-y-4">
          {upcomingDeadlines.map((deadline, i) => {
            const daysUntil = getDaysUntilDeadline(deadline.deadline_date);
            const isUrgent = daysUntil <= 14 && daysUntil > 0;
            const isOverdue = daysUntil < 0;

            return (
              <Card
                key={i}
                className={isOverdue ? 'border-red-300 bg-red-50' : isUrgent ? 'border-orange-300 bg-orange-50' : ''}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm">{deadline.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(deadline.deadline_date), 'PPP', { locale: de })}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getPriorityColor(deadline.priority)}>
                        {deadline.priority}
                      </Badge>
                      <div className={`text-sm font-bold mt-2 ${
                        isOverdue ? 'text-red-600' :
                        isUrgent ? 'text-orange-600' :
                        daysUntil > 30 ? 'text-green-600' :
                        'text-yellow-600'
                      }`}>
                        {isOverdue ? (
                          <>
                            <AlertTriangle className="w-4 h-4 inline mr-1" />
                            {Math.abs(daysUntil)} Tage überfällig
                          </>
                        ) : (
                          <>
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {daysUntil} Tage verbleibend
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-600">Typ</p>
                      <p className="font-medium capitalize">{deadline.deadline_type}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Verlängerung</p>
                      <p className="font-medium">
                        {deadline.extension_possible ? `Bis ${format(new Date(deadline.extension_deadline), 'PP')}` : 'Nicht möglich'}
                      </p>
                    </div>
                    {deadline.late_payment_interest_rate && (
                      <div>
                        <p className="text-slate-600">Verspätungszins</p>
                        <p className="font-medium">{deadline.late_payment_interest_rate}% p.a.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Keine Termine für dieses Jahr gefunden
        </div>
      )}

      {/* Legend */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <Badge className="bg-red-100 text-red-800">critical</Badge>
            <p className="text-slate-600 mt-1">Kritisch - sofortige Aufmerksamkeit erforderlich</p>
          </div>
          <div>
            <Badge className="bg-orange-100 text-orange-800">high</Badge>
            <p className="text-slate-600 mt-1">Hoch - baldige Aufmerksamkeit erforderlich</p>
          </div>
          <div>
            <Badge className="bg-blue-100 text-blue-800">medium</Badge>
            <p className="text-slate-600 mt-1">Mittel - regelmäßige Überprüfung</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}