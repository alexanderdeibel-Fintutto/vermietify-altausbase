import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxManagement() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: deadlines = [] } = useQuery({
    queryKey: ['taxDeadlines', CURRENT_YEAR],
    queryFn: () => base44.entities.TaxDeadline.filter({ tax_year: CURRENT_YEAR }) || []
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['elsterSubmissions'],
    queryFn: () => base44.entities.ElsterSubmission.list('-updated_date', 50) || []
  });

  const upcomingDeadlines = deadlines
    .filter(d => new Date(d.deadline_date) > new Date() && new Date(d.deadline_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date));

  const overdueDeadlines = deadlines.filter(d => new Date(d.deadline_date) < new Date() && d.status !== 'completed');

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">💼 Steuerverwaltung</h1>
          <p className="text-slate-500 mt-1">Zentrale Verwaltung aller Steuerdokumente & Fristen</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Ausstehende Fristen</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{upcomingDeadlines.length}</p>
            <p className="text-xs text-slate-500 mt-1">Nächste 30 Tage</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Überfällig</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{overdueDeadlines.length}</p>
            <p className="text-xs text-slate-500 mt-1">Sofort handeln</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Eingereicht</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{submissions.filter(s => s.status === 'submitted').length}</p>
            <p className="text-xs text-slate-500 mt-1">Dieses Jahr</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">In Bearbeitung</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{submissions.filter(s => s.status === 'in_progress').length}</p>
            <p className="text-xs text-slate-500 mt-1">Aktiv bearbeitete</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="deadlines">Fristen</TabsTrigger>
          <TabsTrigger value="submissions">Eingaben</TabsTrigger>
          <TabsTrigger value="actions">Maßnahmen</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Austria */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🇦🇹 Österreich</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to={createPageUrl('TaxDashboardAT')}>
                  <Button variant="outline" className="w-full justify-start">
                    📊 Steuerdashboard
                  </Button>
                </Link>
                <Link to={createPageUrl('AnlageE1cAT')}>
                  <Button variant="outline" className="w-full justify-start">
                    🏠 Anlage E1c
                  </Button>
                </Link>
                <Link to={createPageUrl('AnlageKAPAT')}>
                  <Button variant="outline" className="w-full justify-start">
                    💰 Anlage KAP
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Switzerland */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🇨🇭 Schweiz</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to={createPageUrl('TaxDashboardCH')}>
                  <Button variant="outline" className="w-full justify-start">
                    📊 Steuerdashboard
                  </Button>
                </Link>
                <Link to={createPageUrl('RealEstateCH')}>
                  <Button variant="outline" className="w-full justify-start">
                    🏠 Liegenschaften
                  </Button>
                </Link>
                <Link to={createPageUrl('InvestmentsCH')}>
                  <Button variant="outline" className="w-full justify-start">
                    📈 Wertschriften
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* DACH Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🌍 DACH-Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to={createPageUrl('DACHTaxComparison')}>
                  <Button variant="outline" className="w-full justify-start">
                    📊 Steuervergleich
                  </Button>
                </Link>
                <Link to={createPageUrl('DACHComplianceChecklist')}>
                  <Button variant="outline" className="w-full justify-start">
                    ✅ Compliance
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📋 Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingDeadlines.length > 0 && (
                  <div className="p-3 bg-orange-50 rounded border border-orange-200">
                    <p className="text-sm font-semibold">⚠️ {upcomingDeadlines.length} Frist(en)</p>
                    <p className="text-xs text-slate-600 mt-1">In den nächsten 30 Tagen fällig</p>
                  </div>
                )}
                {overdueDeadlines.length > 0 && (
                  <div className="p-3 bg-red-50 rounded border border-red-200">
                    <p className="text-sm font-semibold">🔴 {overdueDeadlines.length} Überfällig</p>
                    <p className="text-xs text-slate-600 mt-1">Sofortige Aktion erforderlich</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Deadlines Tab */}
        <TabsContent value="deadlines" className="space-y-4">
          {overdueDeadlines.length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700">🔴 Überfällige Fristen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overdueDeadlines.map(d => (
                  <div key={d.id} className="p-3 bg-white rounded border-l-4 border-red-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{d.title}</p>
                        <p className="text-sm text-slate-600">{d.description}</p>
                      </div>
                      <Badge className="bg-red-600">Überfällig</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {upcomingDeadlines.length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-700">⚠️ Anstehende Fristen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingDeadlines.map(d => (
                  <div key={d.id} className="p-3 bg-white rounded border-l-4 border-orange-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{d.title}</p>
                        <p className="text-sm text-slate-600">{d.description}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(d.deadline_date).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <Badge className={getPriorityColor(d.priority)}>{d.priority}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {deadlines.filter(d => d.status === 'completed').length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-700">✅ Abgeschlossene Fristen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {deadlines
                  .filter(d => d.status === 'completed')
                  .slice(0, 5)
                  .map(d => (
                    <div key={d.id} className="p-3 bg-white rounded border-l-4 border-green-500 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm">{d.title}</p>
                        <p className="text-xs text-slate-500">Abgeschlossen: {new Date(d.deadline_date).toLocaleDateString('de-DE')}</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-4">
          {submissions.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {submissions.slice(0, 10).map(s => (
                    <div key={s.id} className="p-3 bg-slate-50 rounded border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm">{s.form_name || 'Tax Form'}</p>
                          <p className="text-xs text-slate-600">{s.country} • {s.tax_year}</p>
                        </div>
                        <Badge
                          className={
                            s.status === 'submitted'
                              ? 'bg-green-100 text-green-800'
                              : s.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {s.status === 'submitted' && '✅ Eingereicht'}
                          {s.status === 'in_progress' && '⏳ In Bearbeitung'}
                          {s.status === 'draft' && '📝 Entwurf'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-slate-600">Keine Eingaben vorhanden</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔄 Empfohlene Maßnahmen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                  <p className="font-semibold text-sm">Daten validieren</p>
                  <p className="text-xs text-slate-600 mt-1">Überprüfen Sie alle Eingaben auf Plausibilität</p>
                  <Button size="sm" className="mt-2 w-full">Validieren</Button>
                </div>
                <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                  <p className="font-semibold text-sm">Optimierungen prüfen</p>
                  <p className="text-xs text-slate-600 mt-1">Entdecken Sie Steuersparmodelle</p>
                  <Button size="sm" className="mt-2 w-full">Analysieren</Button>
                </div>
                <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-500">
                  <p className="font-semibold text-sm">Export vorbereiten</p>
                  <p className="text-xs text-slate-600 mt-1">Generieren Sie PDF und XML</p>
                  <Button size="sm" className="mt-2 w-full">Exportieren</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📅 Nächste Schritte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-semibold text-sm">1. Dateneingang</p>
                    <p className="text-xs text-slate-600">Alle Finanzunterlagen sammeln</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-1" />
                  <div>
                    <p className="font-semibold text-sm">2. Validierung</p>
                    <p className="text-xs text-slate-600">Plausibilitätsprüfung durchführen</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-semibold text-sm">3. Export & Einreichung</p>
                    <p className="text-xs text-slate-600">Steuererklärung einreichen</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}