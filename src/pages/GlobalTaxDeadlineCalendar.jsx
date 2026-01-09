import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Calendar, Clock, AlertTriangle, CheckCircle2, Download } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function GlobalTaxDeadlineCalendar() {
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [showUpcoming, setShowUpcoming] = useState(true);

  // Fetch deadlines
  const { data: allDeadlines = [] } = useQuery({
    queryKey: ['taxDeadlines'],
    queryFn: async () => {
      return await base44.entities.TaxDeadline.list('-deadline_date', 500) || [];
    }
  });

  // Filter deadlines
  const filteredDeadlines = useMemo(() => {
    let filtered = allDeadlines.filter(d => {
      const countryMatch = selectedCountry === 'all' || d.country === selectedCountry;
      const yearMatch = !d.tax_year || d.tax_year === selectedYear;
      return countryMatch && yearMatch && d.is_active;
    });

    if (showUpcoming) {
      const today = new Date();
      filtered = filtered.filter(d => new Date(d.deadline_date) >= today);
    }

    return filtered.sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date));
  }, [allDeadlines, selectedCountry, selectedYear, showUpcoming]);

  // Group by country
  const byCountry = useMemo(() => {
    const groups = { AT: [], CH: [], DE: [] };
    filteredDeadlines.forEach(d => {
      if (groups[d.country]) groups[d.country].push(d);
    });
    return groups;
  }, [filteredDeadlines]);

  // Calculate days until deadline
  const daysUntil = (deadlineDate) => {
    const today = new Date();
    const deadline = new Date(deadlineDate);
    const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Get urgency color
  const getUrgencyColor = (days, priority) => {
    if (days <= 7 || priority === 'critical') return 'border-red-300 bg-red-50';
    if (days <= 14) return 'border-orange-300 bg-orange-50';
    if (days <= 30) return 'border-yellow-300 bg-yellow-50';
    return '';
  };

  // Generate iCal content
  const generateIcal = () => {
    let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Tax Deadline Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Global Tax Deadlines
X-WR-TIMEZONE:Europe/Berlin
BEGIN:VTIMEZONE
TZID:Europe/Berlin
BEGIN:STANDARD
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
END:STANDARD
END:VTIMEZONE
`;

    filteredDeadlines.forEach(d => {
      const date = new Date(d.deadline_date);
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      ical += `BEGIN:VEVENT
UID:tax-${d.id}@calendar.local
DTSTAMP:${new Date().toISOString().replace(/[:-]/g, '').split('.')[0]}Z
DTSTART;VALUE=DATE:${dateStr}
SUMMARY:${d.title} (${d.country})
DESCRIPTION:${d.description || ''}\nPriority: ${d.priority}
PRIORITY:${d.priority === 'critical' ? 1 : d.priority === 'high' ? 2 : 3}
END:VEVENT
`;
    });

    ical += `END:VCALENDAR`;
    return ical;
  };

  // Download iCal
  const downloadIcal = () => {
    const ical = generateIcal();
    const blob = new Blob([ical], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-deadlines-${selectedYear}.ics`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const countryNames = { AT: '🇦🇹 Österreich', CH: '🇨🇭 Schweiz', DE: '🇩🇪 Deutschland' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📅 Global Tax Deadline Calendar</h1>
        <p className="text-slate-500 mt-1">Alle wichtigen Steuerterminen für AT, CH & DE im Überblick</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium">Land</label>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌍 Alle Länder</SelectItem>
              <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
              <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
              <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium">Jahr</label>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
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

        <div className="flex items-end gap-2">
          <Button
            variant={showUpcoming ? 'default' : 'outline'}
            onClick={() => setShowUpcoming(!showUpcoming)}
            className="gap-2"
          >
            <Clock className="w-4 h-4" /> {showUpcoming ? 'Nur zukünftig' : 'Alle'}
          </Button>
          <Button
            onClick={downloadIcal}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" /> iCal
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Gesamt</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{filteredDeadlines.length}</p>
          </CardContent>
        </Card>
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Kritisch (≤7 Tage)</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {filteredDeadlines.filter(d => daysUntil(d.deadline_date) <= 7).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="pt-6 text-center">
            <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Warnung (7-30 Tage)</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {filteredDeadlines.filter(d => {
                const days = daysUntil(d.deadline_date);
                return days > 7 && days <= 30;
              }).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Rechtzeitig (&gt;30 Tage)</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {filteredDeadlines.filter(d => daysUntil(d.deadline_date) > 30).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs by Country */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Alle ({filteredDeadlines.length})</TabsTrigger>
          <TabsTrigger value="AT">AT ({byCountry.AT.length})</TabsTrigger>
          <TabsTrigger value="CH">CH ({byCountry.CH.length})</TabsTrigger>
          <TabsTrigger value="DE">DE ({byCountry.DE.length})</TabsTrigger>
        </TabsList>

        {['all', 'AT', 'CH', 'DE'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
            {(tab === 'all' ? filteredDeadlines : byCountry[tab]).length > 0 ? (
              (tab === 'all' ? filteredDeadlines : byCountry[tab]).map(deadline => {
                const days = daysUntil(deadline.deadline_date);
                return (
                  <Card
                    key={deadline.id}
                    className={`${getUrgencyColor(days, deadline.priority)}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{deadline.title}</h4>
                            <Badge className={
                              deadline.priority === 'critical' ? 'bg-red-100 text-red-800' :
                              deadline.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {deadline.priority}
                            </Badge>
                            <Badge variant="outline">{countryNames[deadline.country]}</Badge>
                          </div>

                          {deadline.description && (
                            <p className="text-sm text-slate-600 mb-2">{deadline.description}</p>
                          )}

                          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(deadline.deadline_date).toLocaleDateString('de-DE', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'numeric',
                                day: 'numeric'
                              })}
                            </div>
                            {deadline.related_forms?.length > 0 && (
                              <div>Formulare: {deadline.related_forms.join(', ')}</div>
                            )}
                            {deadline.extension_possible && (
                              <Badge variant="outline" className="text-xs">✓ Verlängerbar</Badge>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            days <= 7 ? 'text-red-600' :
                            days <= 14 ? 'text-orange-600' :
                            'text-slate-600'
                          }`}>
                            {days} Tage
                          </p>
                          <p className="text-xs text-slate-600 mt-1">verbleibend</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="text-center py-8 text-slate-500">
                Keine Deadlines für diese Filter
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Info Card */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">💡 Tipps zur Verwendung</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-slate-700">
          <p>✓ Exportieren Sie alle Deadlines als iCal-Datei in Ihren Kalender</p>
          <p>✓ Aktivieren Sie Benachrichtigungen für kritische Termine</p>
          <p>✓ Beachten Sie Verlängerungsmöglichkeiten und Fristen</p>
          <p>✓ Manche Länder bieten elektronische Einreichung (AT: FinanzOnline, DE: ELSTER)</p>
        </CardContent>
      </Card>
    </div>
  );
}