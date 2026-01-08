import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertCircle } from 'lucide-react';

export default function TaxCalendar() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const deadlines = [
    {
      date: `31.01.${currentYear}`,
      title: 'Umsatzsteuer-Voranmeldung',
      description: 'Monatliche/Quartalsweise Abgabe',
      urgent: currentMonth === 1,
      type: 'monthly'
    },
    {
      date: `10.02.${currentYear}`,
      title: 'Lohnsteuer-Anmeldung',
      description: 'Monatliche Abgabe',
      urgent: currentMonth === 2,
      type: 'monthly'
    },
    {
      date: `31.05.${currentYear}`,
      title: 'Einkommensteuererklärung',
      description: 'Für Vorjahr (ohne Steuerberater)',
      urgent: currentMonth >= 4 && currentMonth <= 5,
      type: 'yearly'
    },
    {
      date: `31.07.${currentYear}`,
      title: 'Steuererklärung mit Berater',
      description: 'ESt, Anlage V, EÜR etc.',
      urgent: currentMonth >= 6 && currentMonth <= 7,
      type: 'yearly'
    },
    {
      date: `31.12.${currentYear}`,
      title: 'Jahresabschluss',
      description: 'Betriebsprüfung Vorbereitung',
      urgent: currentMonth === 12,
      type: 'yearly'
    }
  ];

  const upcomingDeadlines = deadlines.filter(d => d.urgent);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Steuerkalender {currentYear}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingDeadlines.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">
                {upcomingDeadlines.length} anstehende Fristen
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {deadlines.map((deadline, idx) => (
            <div 
              key={idx} 
              className={`p-3 border rounded-lg ${
                deadline.urgent 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium text-sm">{deadline.title}</div>
                <Badge variant={deadline.urgent ? 'destructive' : 'outline'}>
                  {deadline.type === 'monthly' ? 'Monatlich' : 'Jährlich'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                <Clock className="w-3 h-3" />
                {deadline.date}
              </div>
              
              <div className="text-xs text-slate-600">
                {deadline.description}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t text-xs text-slate-500">
          Hinweis: Fristen können sich ändern. Bitte prüfen Sie die aktuellen Termine beim Finanzamt.
        </div>
      </CardContent>
    </Card>
  );
}