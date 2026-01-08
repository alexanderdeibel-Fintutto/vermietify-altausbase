import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Bell, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ComprehensiveTaxCalendar() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const deadlines = [
    // Monatliche Fristen
    {
      date: `10.01.${currentYear}`,
      title: 'Lohnsteuer-Anmeldung Dezember',
      type: 'monthly',
      category: 'lohnsteuer',
      urgent: currentMonth === 1,
      description: 'Lohnsteuer-Anmeldung für Vormonat'
    },
    {
      date: `10.02.${currentYear}`,
      title: 'Lohnsteuer-Anmeldung Januar',
      type: 'monthly',
      category: 'lohnsteuer',
      urgent: currentMonth === 2,
      description: 'Lohnsteuer-Anmeldung für Vormonat'
    },
    {
      date: `10.03.${currentYear}`,
      title: 'Lohnsteuer-Anmeldung Februar',
      type: 'monthly',
      category: 'lohnsteuer',
      urgent: currentMonth === 3,
      description: 'Lohnsteuer-Anmeldung für Vormonat'
    },
    
    // Quartalsweise
    {
      date: `10.04.${currentYear}`,
      title: 'Umsatzsteuer-Voranmeldung Q1',
      type: 'quarterly',
      category: 'umsatzsteuer',
      urgent: currentMonth === 4,
      description: 'Quartalsweise Umsatzsteuer-Voranmeldung'
    },
    {
      date: `10.07.${currentYear}`,
      title: 'Umsatzsteuer-Voranmeldung Q2',
      type: 'quarterly',
      category: 'umsatzsteuer',
      urgent: currentMonth === 7,
      description: 'Quartalsweise Umsatzsteuer-Voranmeldung'
    },
    {
      date: `10.10.${currentYear}`,
      title: 'Umsatzsteuer-Voranmeldung Q3',
      type: 'quarterly',
      category: 'umsatzsteuer',
      urgent: currentMonth === 10,
      description: 'Quartalsweise Umsatzsteuer-Voranmeldung'
    },
    
    // Jährliche Fristen
    {
      date: `31.01.${currentYear}`,
      title: 'Grundsteuer',
      type: 'yearly',
      category: 'grundsteuer',
      urgent: currentMonth === 1,
      description: 'Vierteljährliche Grundsteuer-Zahlung'
    },
    {
      date: `31.01.${currentYear}`,
      title: 'Umsatzsteuer-Jahreserklärung Vorjahr',
      type: 'yearly',
      category: 'umsatzsteuer',
      urgent: currentMonth === 1,
      description: 'Jahres-Umsatzsteuererklärung'
    },
    {
      date: `28.02.${currentYear}`,
      title: 'Zusammenfassende Meldung',
      type: 'yearly',
      category: 'umsatzsteuer',
      urgent: currentMonth === 2,
      description: 'ZM für innergemeinschaftliche Lieferungen'
    },
    {
      date: `15.03.${currentYear}`,
      title: 'Kirchensteuer auf Kapitalerträge',
      type: 'yearly',
      category: 'kirchensteuer',
      urgent: currentMonth === 3,
      description: 'Kirchensteuer-Anmeldung'
    },
    {
      date: `31.05.${currentYear}`,
      title: 'Einkommensteuererklärung',
      type: 'yearly',
      category: 'einkommensteuer',
      urgent: currentMonth >= 4 && currentMonth <= 5,
      description: 'Frist ohne Steuerberater'
    },
    {
      date: `31.07.${currentYear}`,
      title: 'Steuererklärung mit Berater',
      type: 'yearly',
      category: 'einkommensteuer',
      urgent: currentMonth >= 6 && currentMonth <= 7,
      description: 'ESt, Anlage V, EÜR, Gewerbesteuer'
    },
    {
      date: `30.09.${currentYear}`,
      title: 'Gewerbesteuer-Vorauszahlung Q3',
      type: 'quarterly',
      category: 'gewerbesteuer',
      urgent: currentMonth === 9,
      description: 'Quartalsweise Gewerbesteuer'
    },
    {
      date: `31.12.${currentYear}`,
      title: 'Jahresabschluss',
      type: 'yearly',
      category: 'buchhaltung',
      urgent: currentMonth === 12,
      description: 'Betriebsprüfung Vorbereitung'
    },
    {
      date: `31.12.${currentYear}`,
      title: 'Inventur',
      type: 'yearly',
      category: 'buchhaltung',
      urgent: currentMonth === 12,
      description: 'Bestandsaufnahme für Jahresabschluss'
    }
  ];

  const categories = [
    { key: 'all', label: 'Alle', color: 'slate' },
    { key: 'einkommensteuer', label: 'Einkommensteuer', color: 'blue' },
    { key: 'umsatzsteuer', label: 'Umsatzsteuer', color: 'purple' },
    { key: 'gewerbesteuer', label: 'Gewerbesteuer', color: 'green' },
    { key: 'lohnsteuer', label: 'Lohnsteuer', color: 'yellow' },
    { key: 'grundsteuer', label: 'Grundsteuer', color: 'orange' },
    { key: 'buchhaltung', label: 'Buchhaltung', color: 'red' }
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredDeadlines = deadlines.filter(d => 
    selectedCategory === 'all' || d.category === selectedCategory
  );

  const upcomingDeadlines = filteredDeadlines.filter(d => d.urgent);
  const nextMonthDeadlines = filteredDeadlines.filter(d => {
    const deadlineDate = new Date(d.date.split('.').reverse().join('-'));
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return deadlineDate.getMonth() === nextMonth.getMonth();
  });

  const handleExportCalendar = () => {
    const icsContent = generateICS(deadlines);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `steuerkalender-${currentYear}.ics`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Umfassender Steuerkalender {currentYear}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportCalendar}>
            <Download className="w-4 h-4 mr-2" />
            .ics Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alert für anstehende Fristen */}
        {upcomingDeadlines.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-700">
                {upcomingDeadlines.length} Fristen in diesem Monat!
              </span>
            </div>
            <div className="space-y-1">
              {upcomingDeadlines.map((d, idx) => (
                <div key={idx} className="text-sm text-red-600 flex items-center gap-2">
                  <Bell className="w-3 h-3" />
                  {d.title} - {d.date}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kategorie-Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <Badge
              key={cat.key}
              variant={selectedCategory === cat.key ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(cat.key)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>

        <Tabs defaultValue="calendar">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">Kalender</TabsTrigger>
            <TabsTrigger value="upcoming">Anstehend</TabsTrigger>
            <TabsTrigger value="next-month">Nächster Monat</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredDeadlines.map((deadline, idx) => (
                <DeadlineCard key={idx} deadline={deadline} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4">
            <div className="space-y-2">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((deadline, idx) => (
                  <DeadlineCard key={idx} deadline={deadline} highlight />
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>Keine anstehenden Fristen in diesem Monat</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="next-month" className="mt-4">
            <div className="space-y-2">
              {nextMonthDeadlines.length > 0 ? (
                nextMonthDeadlines.map((deadline, idx) => (
                  <DeadlineCard key={idx} deadline={deadline} />
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>Keine Fristen im nächsten Monat</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="pt-3 border-t text-xs text-slate-500 space-y-1">
          <p>💡 <strong>Tipp:</strong> Nutzen Sie den .ics Export um die Fristen in Ihren Kalender zu importieren.</p>
          <p>⚠️ <strong>Hinweis:</strong> Fristen können sich ändern. Bitte prüfen Sie die aktuellen Termine beim Finanzamt.</p>
          <p>📅 Bei Fristende auf Wochenende/Feiertag gilt der nächste Werktag.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DeadlineCard({ deadline, highlight }) {
  const typeColors = {
    monthly: 'bg-blue-100 text-blue-800',
    quarterly: 'bg-purple-100 text-purple-800',
    yearly: 'bg-green-100 text-green-800'
  };

  const categoryColors = {
    einkommensteuer: 'text-blue-600',
    umsatzsteuer: 'text-purple-600',
    gewerbesteuer: 'text-green-600',
    lohnsteuer: 'text-yellow-600',
    grundsteuer: 'text-orange-600',
    kirchensteuer: 'text-pink-600',
    buchhaltung: 'text-red-600'
  };

  return (
    <div className={`p-3 border rounded-lg ${highlight ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className={`font-medium text-sm ${categoryColors[deadline.category]}`}>
            {deadline.title}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {deadline.description}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={highlight ? 'destructive' : 'outline'} className="text-xs">
            {deadline.date}
          </Badge>
          <Badge className={typeColors[deadline.type]}>
            {deadline.type === 'monthly' ? 'Monatlich' : 
             deadline.type === 'quarterly' ? 'Quartalsweise' : 'Jährlich'}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function generateICS(deadlines) {
  const events = deadlines.map(d => {
    const dateStr = d.date.split('.').reverse().join('');
    return `BEGIN:VEVENT
UID:${Date.now()}-${Math.random()}@steuerkalender
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART;VALUE=DATE:${dateStr}
SUMMARY:${d.title}
DESCRIPTION:${d.description}
CATEGORIES:${d.category}
STATUS:CONFIRMED
END:VEVENT`;
  }).join('\n');

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ImmoVerwalter//Steuerkalender//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Steuerkalender ${new Date().getFullYear()}
X-WR-TIMEZONE:Europe/Berlin
${events}
END:VCALENDAR`;
}