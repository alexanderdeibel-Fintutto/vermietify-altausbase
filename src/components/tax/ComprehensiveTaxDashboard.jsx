import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Clock, TrendingUp, DollarSign } from 'lucide-react';

export default function ComprehensiveTaxDashboard() {
  const [activeYear, setActiveYear] = useState(new Date().getFullYear() - 1);

  const { data: profile } = useQuery({
    queryKey: ['taxProfile'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const profiles = await base44.entities.TaxProfile.filter({
        user_email: user.email
      }, '-updated_date', 1);
      return profiles[0];
    }
  });

  const { data: reminders } = useQuery({
    queryKey: ['taxReminders', activeYear],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.TaxReminder.filter({
        user_email: user.email,
        tax_year: activeYear
      }, '-scheduled_date');
    }
  });

  const { data: filings } = useQuery({
    queryKey: ['taxFilings', activeYear],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.TaxFiling.filter({
        user_email: user.email,
        tax_year: activeYear
      });
    }
  });

  if (!profile) {
    return <div className="p-4 text-slate-500">Steuerprofil wird geladen...</div>;
  }

  const upcomingReminders = reminders?.filter(r => r.status === 'pending') || [];
  const completedReminders = reminders?.filter(r => r.status === 'sent' || r.status === 'read') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light">Steuerverwaltungs-Dashboard</h1>
        <p className="text-slate-500 font-light mt-2">
          Profil: {profile.profile_type} | Jurisdiktionen: {profile.tax_jurisdictions.join(', ')}
        </p>
      </div>

      {/* Übersicht */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-slate-500 font-light">Komplexitätsscore</div>
            <div className="text-2xl font-light mt-2">{profile.estimated_annual_tax ? Math.round(profile.estimated_annual_tax / 1000) : '-'}</div>
            <Progress value={profile.estimated_annual_tax ? Math.min(100, (profile.estimated_annual_tax / 100000) * 100) : 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-slate-500 font-light">Pendende Fristen</div>
            <div className="text-2xl font-light mt-2 text-orange-600">{upcomingReminders.length}</div>
            <p className="text-xs text-slate-500 mt-1">zu beachten</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-slate-500 font-light">Eingereichte Erklärungen</div>
            <div className="text-2xl font-light mt-2 text-green-600">{filings?.filter(f => f.status === 'submitted').length || 0}</div>
            <p className="text-xs text-slate-500 mt-1">für {activeYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-slate-500 font-light">Datenqualität</div>
            <div className="text-2xl font-light mt-2 text-blue-600">
              {profile.finapi_connected ? '90%' : '40%'}
            </div>
            <p className="text-xs text-slate-500 mt-1">{profile.finapi_connected ? 'APIs aktiv' : 'Manuell'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="deadlines" className="w-full">
        <TabsList>
          <TabsTrigger value="deadlines">Fristen</TabsTrigger>
          <TabsTrigger value="jurisdictions">Jurisdiktionen</TabsTrigger>
          <TabsTrigger value="filings">Eingaben</TabsTrigger>
          <TabsTrigger value="optimization">Optimierung</TabsTrigger>
        </TabsList>

        <TabsContent value="deadlines" className="space-y-4">
          {upcomingReminders.length > 0 ? (
            <div className="space-y-2">
              {upcomingReminders.slice(0, 5).map(reminder => (
                <Card key={reminder.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
                        <div>
                          <p className="font-light text-sm">{reminder.title}</p>
                          <p className="text-xs text-slate-500">{reminder.message}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-600">{reminder.scheduled_date}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>Alle Fristen erfüllt!</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="jurisdictions" className="space-y-4">
          {profile.tax_jurisdictions.map(jurisdiction => (
            <Card key={jurisdiction}>
              <CardHeader>
                <CardTitle className="text-sm">{jurisdiction === 'CH' ? 'Schweiz' : jurisdiction === 'DE' ? 'Deutschland' : 'Österreich'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm font-light">
                  Deadline: {jurisdiction === 'CH' ? '15. März' : jurisdiction === 'DE' ? '31. Mai' : '2. Juni'}
                </div>
                <div className="text-sm font-light text-slate-600">
                  Status: {filings?.filter(f => f.country === jurisdiction && f.status === 'submitted').length > 0 ? '✓ Eingereicht' : '◌ Ausstehend'}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="filings" className="space-y-4">
          {filings && filings.length > 0 ? (
            <div className="space-y-2">
              {filings.map(filing => (
                <Card key={filing.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {filing.status === 'submitted' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        {filing.status === 'draft' && <Clock className="w-5 h-5 text-yellow-600" />}
                        <div>
                          <p className="font-light text-sm">{filing.country || 'CH'} - {filing.filing_type}</p>
                          <p className="text-xs text-slate-500">Status: {filing.status}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-600">{filing.submission_date || 'Nicht eingereicht'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Keine Eingaben für {activeYear}</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Optimierungspotenzial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.has_crypto_assets && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm font-light">
                  💡 Kryptowährungen: Tax-Loss-Harvesting Strategie überprüfen
                </div>
              )}
              {profile.number_of_companies > 0 && (
                <div className="p-3 bg-green-50 rounded-lg text-sm font-light">
                  💡 Unternehmensanteile: Transparanzbericht prüfen
                </div>
              )}
              {profile.number_of_properties > 1 && (
                <div className="p-3 bg-purple-50 rounded-lg text-sm font-light">
                  💡 Immobilien: Abschreibungsstrategie überprüfen
                </div>
              )}
              {profile.tax_jurisdictions.length > 1 && (
                <div className="p-3 bg-orange-50 rounded-lg text-sm font-light">
                  💡 Grenzüberschreitend: Treaty-Optimierung prüfen
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}