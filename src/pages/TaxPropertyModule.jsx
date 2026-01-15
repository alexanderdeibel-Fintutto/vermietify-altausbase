import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  FileText,
  BarChart3,
  TrendingUp,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function TaxPropertyModule() {
  const modules = [
    {
      title: 'Anlage V Dashboard',
      description: 'Alle Einnahmen und Ausgaben aus Vermietung auf einen Blick',
      icon: FileText,
      page: 'AnlageVDashboard',
      status: 'active',
      features: [
        'Einnahmen & Kosten erfassen',
        'Automatische Berechnung',
        'DATEV & ELSTER Export'
      ]
    },
    {
      title: 'Betriebskostenabrechnung',
      description: 'Intelligente Verteilung von Betriebskosten auf Mieter',
      icon: BarChart3,
      page: 'OperatingCosts',
      status: 'active',
      features: [
        'Kosten verteilen (EQUAL/m²/Meter)',
        'Abrechnungen generieren',
        'Mieter-Benachrichtigungen'
      ]
    },
    {
      title: 'Mieterhöhungs-Tool',
      description: 'Rechtskonforme Mieterhöhungen mit automatischen Anschreiben',
      icon: TrendingUp,
      page: 'RentIncreaseManager',
      status: 'active',
      features: [
        'Index/Markt-basierte Berechnung',
        'BGB §558 Compliance Check',
        'PDF-Anschreiben generieren'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Steuerverwaltung Immobilien</h1>
        <p className="text-gray-600 mt-2">
          Verwaltung aller steuerlichen und abrechnungstechnischen Aspekte für Vermietung
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, idx) => {
          const Icon = module.icon;
          return (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Icon className="w-8 h-8 text-blue-600" />
                  <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    {module.status === 'active' ? 'Aktiv' : 'Bald'}
                  </div>
                </div>
                <CardTitle className="mt-4">{module.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{module.description}</p>

                <div className="space-y-2">
                  {module.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      {feature}
                    </div>
                  ))}
                </div>

                <Link to={createPageUrl(module.page)}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                    Öffnen
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">ℹ️ Rechtliche Hinweise</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-gray-700">
          <p>✓ Alle Abrechnungen entsprechen der Betriebskosten-Verordnung (BetrKV)</p>
          <p>✓ Mieterhöhungen beachten BGB §556 und §558 (max. 20% in 3 Jahren)</p>
          <p>✓ Daten können als CSV für Steuerberater exportiert werden</p>
          <p>✓ ELSTER-XML-Export für direkte Steuererklärungen</p>
        </CardContent>
      </Card>
    </div>
  );
}