import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export default function GlobalTaxDeadlineCalendar() {
  const [country, setCountry] = useState('DE');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const { data: deadlines = [], isLoading } = useQuery({
    queryKey: ['taxDeadlines', country],
    queryFn: () => base44.entities.TaxDeadline.filter({ country }).catch(() => [])
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => null);

  const getDeadlinesForDay = (day) => {
    return deadlines.filter(d => {
      const date = new Date(d.deadline_date);
      return date.getDate() === day && 
             date.getMonth() === currentMonth && 
             date.getFullYear() === currentYear;
    });
  };

  const priorityColor = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  const upcomingDeadlines = deadlines
    .filter(d => new Date(d.deadline_date) >= new Date())
    .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date))
    .slice(0, 5);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📅 Globaler Steuerterminks</h1>
        <p className="text-slate-500 mt-1">Alle wichtigen Steuerdadelines auf einen Blick</p>
      </div>

      {/* Country & Month Controls */}
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
        <div className="flex items-end gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 text-center">
            <h2 className="font-bold">{MONTHS[currentMonth]} {currentYear}</h2>
          </div>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Termine werden geladen...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-6">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                    <div key={day} className="text-center font-bold text-sm text-slate-600 p-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                  {[...emptyDays, ...days].map((day, idx) => {
                    const dayDeadlines = day ? getDeadlinesForDay(day) : [];
                    const hasCritical = dayDeadlines.some(d => d.priority === 'critical');
                    const hasHigh = dayDeadlines.some(d => d.priority === 'high');

                    return (
                      <div
                        key={idx}
                        className={`aspect-square p-1 rounded border text-xs ${
                          day
                            ? `bg-white border-slate-200 hover:bg-slate-50 cursor-pointer ${
                                hasCritical ? 'border-red-400 bg-red-50' : hasHigh ? 'border-orange-400 bg-orange-50' : ''
                              }`
                            : 'bg-slate-100 border-slate-100'
                        }`}
                      >
                        {day && (
                          <div className="h-full flex flex-col">
                            <span className="font-bold">{day}</span>
                            <div className="flex-1 flex flex-col gap-0.5 mt-1">
                              {dayDeadlines.slice(0, 2).map((d, i) => (
                                <div
                                  key={i}
                                  className={`text-xs px-1 rounded truncate text-white ${
                                    d.priority === 'critical'
                                      ? 'bg-red-500'
                                      : d.priority === 'high'
                                      ? 'bg-orange-500'
                                      : 'bg-blue-500'
                                  }`}
                                  title={d.title}
                                >
                                  {d.title}
                                </div>
                              ))}
                              {dayDeadlines.length > 2 && (
                                <div className="text-xs px-1 text-slate-600">+{dayDeadlines.length - 2} mehr</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Deadlines */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">⏰ Nächste Termine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingDeadlines.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Keine anstehenden Termine</p>
                ) : (
                  upcomingDeadlines.map(deadline => {
                    const daysUntil = Math.ceil((new Date(deadline.deadline_date) - new Date()) / (1000 * 60 * 60 * 24));
                    const isUrgent = daysUntil <= 7;

                    return (
                      <div
                        key={deadline.id}
                        className={`p-3 rounded-lg border ${
                          isUrgent
                            ? 'bg-red-50 border-red-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{deadline.title}</p>
                            <p className="text-xs text-slate-600 mt-1">
                              {new Date(deadline.deadline_date).toLocaleDateString('de-DE')}
                            </p>
                            {isUrgent && (
                              <p className="text-xs text-red-600 font-bold mt-1">
                                ⚠️ In {daysUntil} Tagen
                              </p>
                            )}
                          </div>
                          <Badge className={priorityColor[deadline.priority]}>
                            {deadline.priority}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Termine im {MONTHS[currentMonth]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Gesamt:</span>
                  <span className="font-bold">{deadlines.filter(d => {
                    const date = new Date(d.deadline_date);
                    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                  }).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">🔴 Kritisch:</span>
                  <span className="font-bold text-red-600">{deadlines.filter(d => {
                    const date = new Date(d.deadline_date);
                    return d.priority === 'critical' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                  }).length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}