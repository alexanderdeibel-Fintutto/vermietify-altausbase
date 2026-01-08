import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TaxCalendar() {
  const [year, setYear] = useState(new Date().getFullYear());

  const deadlines = [
    { month: 1, day: 10, form: 'Umsatzsteuer-Voranmeldung', description: 'Dezember Voranmeldung', critical: false },
    { month: 2, day: 10, form: 'Umsatzsteuer-Voranmeldung', description: 'Januar Voranmeldung', critical: false },
    { month: 3, day: 10, form: 'Umsatzsteuer-Voranmeldung', description: 'Februar Voranmeldung', critical: false },
    { month: 3, day: 31, form: 'Zusammenfassende Meldung', description: 'Q1 Zusammenfassung', critical: false },
    { month: 4, day: 10, form: 'Umsatzsteuer-Voranmeldung', description: 'März Voranmeldung', critical: false },
    { month: 5, day: 10, form: 'Umsatzsteuer-Voranmeldung', description: 'April Voranmeldung', critical: false },
    { month: 5, day: 31, form: 'Gewerbesteuer', description: 'Vorauszahlung Q2', critical: true },
    { month: 6, day: 10, form: 'Umsatzsteuer-Voranmeldung', description: 'Mai Voranmeldung', critical: false },
    { month: 7, day: 10, form: 'Umsatzsteuer-Voranmeldung', description: 'Juni Voranmeldung', critical: false },
    { month: 7, day: 31, form: 'Einkommensteuererklärung', description: 'Jahreserklärung (ohne Berater)', critical: true },
    { month: 8, day: 10, form: 'Umsatzsteuer-Voranmeldung', description: 'Juli Voranmeldung', critical: false },
    { month: 9, day: 10, form: 'Umsatzsteuer-Voranmeldung', description: 'August Voranmeldung', critical: false },
    { month: 10, day: 10, form: 'Umsatzsteuer-Voranmeldung', description: 'September Voranmeldung', critical: false },
    { month: 11, day: 10, form: 'Umsatzsteuer-Voranmeldung', description: 'Oktober Voranmeldung', critical: false },
    { month: 12, day: 10, form: 'Umsatzsteuer-Voranmeldung', description: 'November Voranmeldung', critical: false }
  ];

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const upcomingDeadlines = deadlines
    .map(d => ({
      ...d,
      date: new Date(year, d.month - 1, d.day),
      isPast: d.month < currentMonth || (d.month === currentMonth && d.day < currentDay),
      isUpcoming: d.month === currentMonth || d.month === currentMonth + 1
    }))
    .filter(d => !d.isPast);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Steuer-Kalender
          </CardTitle>
          <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[year - 1, year, year + 1].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {upcomingDeadlines.length === 0 ? (
            <p className="text-center text-slate-500 py-4">Keine anstehenden Fristen</p>
          ) : (
            upcomingDeadlines.map((deadline, idx) => {
              const daysUntil = Math.floor((deadline.date - now) / (1000 * 60 * 60 * 24));
              const isUrgent = daysUntil <= 7;

              return (
                <div 
                  key={idx} 
                  className={`p-3 border rounded-lg ${
                    isUrgent ? 'bg-orange-50 border-orange-200' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{deadline.form}</div>
                      <div className="text-xs text-slate-600 mt-1">{deadline.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {deadline.date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                        </Badge>
                        {isUrgent && (
                          <Badge variant="destructive" className="text-xs">
                            {daysUntil} Tage
                          </Badge>
                        )}
                        {deadline.critical && (
                          <AlertCircle className="w-3 h-3 text-orange-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}