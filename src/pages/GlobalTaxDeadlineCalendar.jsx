import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const COUNTRIES = {
  AT: { name: 'Österreich', flag: '🇦🇹', color: 'red' },
  CH: { name: 'Schweiz', flag: '🇨🇭', color: 'blue' },
  DE: { name: 'Deutschland', flag: '🇩🇪', color: 'gold' }
};

export default function GlobalTaxDeadlineCalendar() {
  const [selectedCountries, setSelectedCountries] = useState(['AT', 'CH', 'DE']);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch deadlines
  const { data: deadlines = [] } = useQuery({
    queryKey: ['taxDeadlines', selectedCountries],
    queryFn: async () => {
      const allDeadlines = [];
      for (const country of selectedCountries) {
        const countryDeadlines = await base44.entities.TaxDeadline.filter(
          { country, is_active: true },
          '-deadline_date',
          100
        );
        allDeadlines.push(...countryDeadlines);
      }
      return allDeadlines;
    }
  });

  const toggleCountry = (country) => {
    setSelectedCountries(prev =>
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    );
  };

  const getDaysUntil = (date) => {
    const today = new Date();
    const deadline = new Date(date);
    const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getUrgencyClass = (daysUntil) => {
    if (daysUntil < 0) return 'border-l-gray-400 bg-gray-50';
    if (daysUntil <= 7) return 'border-l-red-500 bg-red-50';
    if (daysUntil <= 30) return 'border-l-orange-500 bg-orange-50';
    if (daysUntil <= 90) return 'border-l-yellow-500 bg-yellow-50';
    return 'border-l-green-500 bg-green-50';
  };

  const getUrgencyIcon = (daysUntil) => {
    if (daysUntil < 0) return '✓';
    if (daysUntil <= 7) return '🔴';
    if (daysUntil <= 30) return '🟠';
    if (daysUntil <= 90) return '🟡';
    return '🟢';
  };

  const upcomingDeadlines = deadlines.filter(d => getDaysUntil(d.deadline_date) > 0)
    .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date));
  const overdueDeadlines = deadlines.filter(d => getDaysUntil(d.deadline_date) <= 0);
  const criticalDeadlines = upcomingDeadlines.filter(d => getDaysUntil(d.deadline_date) <= 7);

  const filteredDeadlines = () => {
    switch (activeTab) {
      case 'critical':
        return criticalDeadlines;
      case 'upcoming':
        return upcomingDeadlines;
      case 'overdue':
        return overdueDeadlines;
      default:
        return upcomingDeadlines;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📅 Global Tax Deadline Calendar</h1>
        <p className="text-slate-500 mt-1">Übersicht aller Steuerterminen in AT, CH & DE</p>
      </div>

      {/* Country Selection */}
      <div className="flex gap-2">
        {Object.entries(COUNTRIES).map(([code, config]) => (
          <Button
            key={code}
            onClick={() => toggleCountry(code)}
            variant={selectedCountries.includes(code) ? 'default' : 'outline'}
            className={selectedCountries.includes(code) ? `bg-${config.color}-600` : ''}
          >
            {config.flag} {config.name}
          </Button>
        ))}
      </div>

      {/* Critical Alerts */}
      {criticalDeadlines.length > 0 && (
        <Alert className="border-red-300 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>{criticalDeadlines.length} Deadline(s) in den nächsten 7 Tagen!</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{upcomingDeadlines.length}</p>
            <p className="text-sm text-slate-600 mt-1">Ausstehend</p>
          </CardContent>
        </Card>
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-red-600">{criticalDeadlines.length}</p>
            <p className="text-sm text-slate-600 mt-1">Kritisch</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{overdueDeadlines.length}</p>
            <p className="text-sm text-slate-600 mt-1">Überfällig</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{deadlines.length}</p>
            <p className="text-sm text-slate-600 mt-1">Gesamt</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">
            <Clock className="w-4 h-4 mr-2" /> Ausstehend ({upcomingDeadlines.length})
          </TabsTrigger>
          <TabsTrigger value="critical">
            <AlertTriangle className="w-4 h-4 mr-2" /> Kritisch ({criticalDeadlines.length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Überfällig ({overdueDeadlines.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-3 mt-4">
          {filteredDeadlines().length === 0 ? (
            <Card className="text-center py-8 text-slate-500">
              Keine Einträge für diese Kategorie
            </Card>
          ) : (
            filteredDeadlines().map(deadline => {
              const daysUntil = getDaysUntil(deadline.deadline_date);
              return (
                <Card
                  key={deadline.id}
                  className={`border-l-4 ${getUrgencyClass(daysUntil)}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getUrgencyIcon(daysUntil)}</span>
                          <h3 className="font-semibold">{deadline.title}</h3>
                          <Badge className={getPriorityColor(deadline.priority)}>
                            {deadline.priority?.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{COUNTRIES[deadline.country]?.flag}</Badge>
                        </div>
                        <p className="text-sm text-slate-600">{deadline.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {daysUntil > 0 ? `${daysUntil}d` : 'Überfällig'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(deadline.deadline_date).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>

                    {deadline.related_forms?.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {deadline.related_forms.map(form => (
                          <Badge key={form} variant="secondary" className="text-xs">
                            {form}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {deadline.extension_possible && (
                      <p className="text-xs text-slate-600 mt-2">
                        💡 Verlängerung möglich bis {new Date(deadline.extension_deadline).toLocaleDateString('de-DE')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Tips */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">💡 Tipps</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-slate-700">
          <p>✓ Setzen Sie sich Erinnerungen 30 Tage vor Fristen</p>
          <p>✓ Prüfen Sie Möglichkeiten für Fristverlängerungen</p>
          <p>✓ Sammeln Sie Belege rechtzeitig</p>
          <p>✓ Koordinieren Sie mit Ihrem Steuerberater</p>
        </CardContent>
      </Card>
    </div>
  );
}