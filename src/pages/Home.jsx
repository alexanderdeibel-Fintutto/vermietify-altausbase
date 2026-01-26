import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, FileText, Zap, Check, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getPricing } from '../services/pricing';

export default function Home() {
  const { data: pricing } = useQuery({
    queryKey: ['pricing'],
    queryFn: getPricing,
    staleTime: 5 * 60 * 1000
  });

  const features = [
    'Rechtssichere NK-Abrechnungen nach BetrKV',
    'Automatische Kostenverteilung nach Wohnfläche, Personen oder Verbrauch',
    'HeizkostenV-konforme 70/30-Aufteilung',
    'Integration von Zählerständen',
    'PDF-Export für jeden Mieter',
    'Email-Versand direkt an Mieter'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full mb-6">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-semibold">Von FinTuttO</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-900 to-orange-600 bg-clip-text text-transparent">
            Nebenkostenabrechnungen<br />in Minuten erstellen
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Rechtssichere Betriebskostenabrechnungen nach BetrKV - 
            mit automatischer Kostenverteilung und PDF-Export.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link to={createPageUrl('Dashboard')}>
              <Button size="lg" className="bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600">
                Jetzt starten
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to={createPageUrl('Pricing')}>
              <Button size="lg" variant="outline">
                Preise ansehen
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-7 h-7 text-blue-700" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Automatische Berechnung</h3>
              <p className="text-gray-600 text-sm">
                Kosten werden automatisch nach Wohnfläche, Personen oder Verbrauch verteilt.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-orange-700" />
              </div>
              <h3 className="font-semibold text-lg mb-2">HeizkostenV-konform</h3>
              <p className="text-gray-600 text-sm">
                70/30-Aufteilung nach Heizkostenverordnung mit Zählerstand-Integration.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-green-700" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Direktversand</h3>
              <p className="text-gray-600 text-sm">
                PDF-Abrechnungen per Email an alle Mieter mit einem Klick versenden.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features List */}
        <Card className="mb-16">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Alle Features im Überblick</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cross-Sell to FinTuttO */}
        <Card className="mb-16">
          <div className="p-8 text-center">
            <h3 className="text-xl font-bold mb-4">Teil der FinTuttO Suite</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Diese App ist Teil der FinTuttO Immobilienverwaltungs-Suite. 
              Für die komplette Verwaltung mit Finanzen, Dokumenten, Steuern und mehr nutzen Sie die Hauptapplikation.
            </p>
            <a href="https://vermietify.app" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg">
                FinTuttO Hauptapp ansehen
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-blue-900 to-orange-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Bereit für rechtssichere Nebenkostenabrechnungen?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            {pricing?.[0] ? `Ab ${pricing[0].monthly_price?.toFixed(2)}€/Monat` : 'Jetzt kostenlos testen'}
          </p>
          <Link to={createPageUrl('Dashboard')}>
            <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100">
              Kostenlos testen
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}