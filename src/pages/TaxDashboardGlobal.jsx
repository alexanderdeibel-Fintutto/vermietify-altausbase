import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Globe, Settings, TrendingUp } from 'lucide-react';

const COUNTRY_CONFIG = {
  DE: { name: 'Deutschland', flag: '🇩🇪', path: 'TaxDashboard', color: 'from-blue-50 to-blue-100' },
  AT: { name: 'Österreich', flag: '🇦🇹', path: 'TaxDashboardAT', color: 'from-red-50 to-red-100' },
  CH: { name: 'Schweiz', flag: '🇨🇭', path: 'TaxDashboardCH', color: 'from-green-50 to-green-100' }
};

export default function TaxDashboardGlobal() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  if (!user?.tax_setup_completed) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-2 border-blue-300">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-bold mb-4">🚀 Willkommen zur Steuerverwaltung</p>
            <p className="text-slate-600 mb-4">Bitte konfigurieren Sie zunächst Ihre Länder und Daten.</p>
            <Link to={createPageUrl('TaxSetupWizard')}>
              <Button className="gap-2">
                <Settings className="w-4 h-4" /> Konfiguration starten
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const countries = user?.preferred_countries || ['DE'];
  const primaryCountry = user?.primary_country || 'DE';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Globe className="w-8 h-8" /> Steuererklärung DACH
        </h1>
        <Link to={createPageUrl('TaxSetupWizard')}>
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" /> Einstellungen
          </Button>
        </Link>
      </div>

      {/* Primary Country Card */}
      {primaryCountry && (
        <div>
          <h2 className="text-lg font-bold mb-3">Hauptland</h2>
          <Link to={createPageUrl(COUNTRY_CONFIG[primaryCountry].path)}>
            <Card className={`bg-gradient-to-br ${COUNTRY_CONFIG[primaryCountry].color} hover:shadow-lg transition-shadow cursor-pointer border-2 border-slate-200`}>
              <CardContent className="pt-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl mb-2">{COUNTRY_CONFIG[primaryCountry].flag}</p>
                    <p className="text-2xl font-bold">{COUNTRY_CONFIG[primaryCountry].name}</p>
                    <p className="text-sm text-slate-600 mt-1">Zur Steuererklärung →</p>
                  </div>
                  <TrendingUp className="w-16 h-16 text-slate-300 opacity-30" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Other Countries */}
      {countries.length > 1 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Weitere Länder</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {countries.filter(c => c !== primaryCountry).map(country => (
              <Link key={country} to={createPageUrl(COUNTRY_CONFIG[country].path)}>
                <Card className={`bg-gradient-to-br ${COUNTRY_CONFIG[country].color} hover:shadow-lg transition-shadow cursor-pointer`}>
                  <CardContent className="pt-6">
                    <div>
                      <p className="text-3xl mb-2">{COUNTRY_CONFIG[country].flag}</p>
                      <p className="text-xl font-bold">{COUNTRY_CONFIG[country].name}</p>
                      <p className="text-xs text-slate-600 mt-1">Zur Steuererklärung →</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Konfiguration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-600">Länder</p>
              <p className="text-lg font-bold">{countries.length}</p>
            </div>
            {user?.swiss_canton && (
              <div>
                <p className="text-slate-600">Schweizer Kanton</p>
                <p className="text-lg font-bold">{user.swiss_canton}</p>
              </div>
            )}
            <div>
              <p className="text-slate-600">Sprache</p>
              <p className="text-lg font-bold">{user?.language === 'de' ? 'Deutsch' : 'Englisch'}</p>
            </div>
            <div>
              <p className="text-slate-600">Währung</p>
              <p className="text-lg font-bold">{user?.currency_preference || 'EUR'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}