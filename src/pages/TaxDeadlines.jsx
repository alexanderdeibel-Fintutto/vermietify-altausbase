import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, AlertTriangle, CheckCircle2, Clock, Bell } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxDeadlines() {
  const [selectedCountry, setSelectedCountry] = useState('AT');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: deadlines = [] } = useQuery({
    queryKey: ['taxDeadlines', selectedCountry, taxYear],
    queryFn: () => base44.entities.TaxDeadline.filter({ country: selectedCountry, tax_year: taxYear }) || []
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (deadlineDate) => {
    const today = new Date();
    const deadline = new Date(deadlineDate);
    const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return <Badge className="bg-red-100 text-red-800">⏰ Überfällig ({Math.abs(daysUntil)} Tage)</Badge>;
    } else if (daysUntil <= 7) {
      return <Badge className="bg-orange-100 text-orange-800">⚠️ Diese Woche ({daysUntil} Tage)</Badge>;
    } else if (daysUntil <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-800">📅 Diesen Monat ({daysUntil} Tage)</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">✅ Geplant ({daysUntil} Tage)</Badge>;
    }
  };

  const priorityColors = {
    low: 'border-blue-300 bg-blue-50',
    medium: 'border-yellow-300 bg-yellow-50',
    high: 'border-orange-300 bg-orange-50',
    critical: 'border-red-300 bg-red-50'
  };

  const priorityIcons = {
    low: '🔵',
    medium: '🟡',
    high: '🔴',
    critical: '🚨'
  };

  const countries = [
    { code: 'AT', name: '🇦🇹 Österreich', color: 'border-l-4 border-red-500' },
    { code: 'CH', name: '🇨🇭 Schweiz', color: 'border-l-4 border-green-500' },
    { code: 'DE', name: '🇩🇪 Deutschland', color: 'border-l-4 border-yellow-500' }
  ];

  const upcomingDeadlines = deadlines.filter(d => {
    const deadline = new Date(d.deadline_date);
    const daysUntil = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 90;
  });

  const overdueDeadlines = deadlines.filter(d => {
    const deadline = new Date(d.deadline_date);
    const daysUntil = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil < 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Calendar className="w-10 h-10" />
            Steuer-Fristen & Deadlines
          </h1>
          <p className="text-slate-500 mt-2">DACH Steuerjahr {taxYear}</p>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Bell className="w-4 h-4" /> Reminders aktivieren
        </Button>
      </div>

      {/* Alert for overdue */}
      {overdueDeadlines.length > 0 && (
        <Card className="border-2 border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">⚠️ Überfällige Fristen</h3>
                <p className="text-sm text-red-800 mt-1">
                  Sie haben {overdueDeadlines.length} überfällige Steuerfrist(en). Bitte kümmern Sie sich schnellstmöglich darum!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Country Tabs */}
      <Tabs value={selectedCountry} onValueChange={setSelectedCountry}>
        <TabsList className="grid w-full grid-cols-3">
          {countries.map(c => (
            <TabsTrigger key={c.code} value={c.code}>{c.name}</TabsTrigger>
          ))}
        </TabsList>

        {countries.map(country => (
          <TabsContent key={country.code} value={country.code} className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2">
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-slate-600">Gesamt Fristen</p>
                  <p className="text-3xl font-bold">{deadlines.length}</p>
                </CardContent>
              </Card>
              <Card className="border-orange-300 bg-orange-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-slate-600">Diese Woche</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {deadlines.filter(d => {
                      const daysUntil = Math.ceil((new Date(d.deadline_date) - new Date()) / (1000 * 60 * 60 * 24));
                      return daysUntil > 0 && daysUntil <= 7;
                    }).length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-yellow-300 bg-yellow-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-slate-600">Diesen Monat</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {deadlines.filter(d => {
                      const daysUntil = Math.ceil((new Date(d.deadline_date) - new Date()) / (1000 * 60 * 60 * 24));
                      return daysUntil > 0 && daysUntil <= 30;
                    }).length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-red-300 bg-red-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-slate-600">Überfällig</p>
                  <p className="text-3xl font-bold text-red-600">{overdueDeadlines.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Deadlines List */}
            <div className="space-y-3">
              {deadlines.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-slate-500">
                    Keine Fristen für {taxYear} erfasst.
                  </CardContent>
                </Card>
              ) : (
                deadlines
                  .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date))
                  .map(deadline => (
                    <Card key={deadline.id} className={`${priorityColors[deadline.priority]} border-2`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">{priorityIcons[deadline.priority]}</span>
                              <h3 className="font-semibold">{deadline.title}</h3>
                              {getStatusBadge(deadline.deadline_date)}
                            </div>
                            <p className="text-sm text-slate-600 mb-3">{deadline.description}</p>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-slate-600">Fällig am:</span>
                                <p className="font-semibold">
                                  {new Date(deadline.deadline_date).toLocaleDateString('de-DE', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                  })}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-600">Art:</span>
                                <p className="font-semibold">
                                  {deadline.deadline_type === 'submission' ? '📋 Einreichung' : '💰 Zahlung'}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-600">Erinnerung:</span>
                                <p className="font-semibold">{deadline.reminder_days_before} Tage vorher</p>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="ml-4">
                            Erledigt
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Info Section */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100">
        <CardHeader>
          <CardTitle>💡 Tipps & Hinweise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-white rounded border-l-4 border-blue-500">
              <p className="font-semibold text-sm">🇦🇹 Österreich</p>
              <p className="text-xs text-slate-600 mt-1">Steuererklärung bis 30.06. (mit Berater bis 02.08.)</p>
            </div>
            <div className="p-3 bg-white rounded border-l-4 border-green-500">
              <p className="font-semibold text-sm">🇨🇭 Schweiz</p>
              <p className="text-xs text-slate-600 mt-1">Erklärung bis 15.03. des Folgejahres, unterschiedlich pro Kanton</p>
            </div>
            <div className="p-3 bg-white rounded border-l-4 border-yellow-500">
              <p className="font-semibold text-sm">🇩🇪 Deutschland</p>
              <p className="text-xs text-slate-600 mt-1">Erklärung bis 31.05. (mit Berater bis 30.09.)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}