import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Settings, Globe, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TaxDashboardGlobal() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['taxConfig'],
    queryFn: async () => {
      try {
        const res = await base44.functions.invoke('getTaxConfig', {});
        return res;
      } catch (error) {
        return null;
      }
    }
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => await base44.auth.me()
  });

  if (isLoading) {
    return <div className="p-8 text-center">Wird geladen...</div>;
  }

  // If no country is configured, show setup
  if (!config?.country) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Steuersystem nicht konfiguriert
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle>Erste Konfiguration erforderlich</AlertTitle>
              <AlertDescription>
                Bitte wählen Sie das Land aus, in dem Sie Ihre Steuererklärung einreichen.
              </AlertDescription>
            </Alert>
            <Link to={createPageUrl('TaxSetup')}>
              <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                <Settings className="w-4 h-4" />
                Steuersystem konfigurieren
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show configured dashboard
  const SWISS_CANTONS = {
    ZH: 'Zürich', BE: 'Bern', LU: 'Luzern', UR: 'Uri', SZ: 'Schwyz',
    OW: 'Obwalden', NW: 'Nidwalden', GL: 'Glarus', ZG: 'Zug', FR: 'Freiburg',
    SO: 'Solothurn', BS: 'Basel-Stadt', BL: 'Basel-Landschaft', SH: 'Schaffhausen',
    AR: 'Appenzell Ausserrhoden', AI: 'Appenzell Innerrhoden', SG: 'Sankt Gallen',
    GR: 'Graubünden', AG: 'Aargau', TG: 'Thurgau', TI: 'Tessin', VD: 'Waadt',
    VS: 'Wallis', NE: 'Neuenburg', GE: 'Genf', JU: 'Jura'
  };

  const countryLabels = {
    DE: '🇩🇪 Deutschland',
    AT: '🇦🇹 Österreich',
    CH: '🇨🇭 Schweiz'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🧾 Steuer-Cockpit</h1>
          <p className="text-slate-500 mt-1">
            {countryLabels[config.country]}
            {config.canton && ` • Kanton ${config.canton}`}
          </p>
        </div>
        <Link to={createPageUrl('TaxSetup')}>
          <Button variant="outline" size="sm" gap="2">
            <Settings className="w-4 h-4" /> Ändern
          </Button>
        </Link>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Steuersystem: {config.submission?.system}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-slate-600">{config.submission?.description}</p>
          <div className="flex gap-2 flex-wrap pt-2">
            {config.submission?.supportedFormats?.map(format => (
              <span key={format} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                {format.toUpperCase()}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Forms */}
      <div>
        <h2 className="text-xl font-bold mb-3">Verfügbare Steuerformulare</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {config.forms?.map(form => (
            <Link key={form.id} to={createPageUrl(`TaxForm_${form.id}`)}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{form.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{form.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t">
        <Button variant="outline" className="justify-start gap-2">
          📊 Jahresübersicht
        </Button>
        <Button variant="outline" className="justify-start gap-2">
          💾 Exportieren
        </Button>
        <Button variant="outline" className="justify-start gap-2">
          ⚙️ Validierung
        </Button>
        <Button variant="outline" className="justify-start gap-2">
          📋 Checkliste
        </Button>
      </div>
    </div>
  );
}