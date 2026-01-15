import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Home,
  FileText,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';

export default function TaxPropertyDashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // AnlageV Statistics
  const { data: anlagenV = [] } = useQuery({
    queryKey: ['anlagenV', selectedYear],
    queryFn: async () => {
      const all = await base44.entities.AnlageV.list();
      return all.filter(a => a.tax_year === selectedYear);
    }
  });

  // Buildings
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  // Operating Cost Statements
  const { data: statements = [] } = useQuery({
    queryKey: ['operatingCostStatements', selectedYear],
    queryFn: async () => {
      const all = await base44.entities.OperatingCostStatement.list();
      return all.filter(s => s.accounting_year === selectedYear);
    }
  });

  // Rent Increase Proposals
  const { data: rentProposals = [] } = useQuery({
    queryKey: ['rentIncreaseProposals', selectedYear],
    queryFn: async () => {
      const all = await base44.entities.RentIncreaseProposal.list();
      return all.filter(p => new Date(p.effective_date).getFullYear() === selectedYear);
    }
  });

  const totalRentals = anlagenV.reduce((sum, a) => sum + (a.total_rentals || 0), 0);
  const totalExpenses = anlagenV.reduce((sum, a) => sum + (a.total_expenses || 0), 0);
  const netIncome = anlagenV.reduce((sum, a) => sum + (a.net_income || 0), 0);

  const statsCards = [
    {
      title: 'Anlage V Anträge',
      value: anlagenV.length,
      icon: FileText,
      color: 'blue',
      status: anlagenV.filter(a => a.status === 'CALCULATED').length,
      statusLabel: 'berechnet'
    },
    {
      title: 'Mieteinnahmen',
      value: `€${totalRentals.toFixed(0)}`,
      icon: TrendingUp,
      color: 'green',
      change: '+12%'
    },
    {
      title: 'Betriebskosten',
      value: `€${totalExpenses.toFixed(0)}`,
      icon: BarChart3,
      color: 'orange',
      change: null
    },
    {
      title: 'Nettoeinkommen',
      value: `€${netIncome.toFixed(0)}`,
      icon: Home,
      color: 'purple',
      change: netIncome > 0 ? '+' : '-'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Steuerverwaltung Immobilien</h1>
        <p className="text-gray-600 mt-2">Zentrale Verwaltung aller Steuerdaten und Abrechnungen</p>
      </div>

      {/* Year Selector */}
      <div className="flex gap-2">
        {[selectedYear - 2, selectedYear - 1, selectedYear, selectedYear + 1].map(year => (
          <Button
            key={year}
            onClick={() => setSelectedYear(year)}
            variant={selectedYear === year ? 'default' : 'outline'}
            className={selectedYear === year ? 'bg-blue-600' : ''}
          >
            {year}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, idx) => {
          const Icon = card.icon;
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            green: 'bg-green-50 text-green-600 border-green-200',
            orange: 'bg-orange-50 text-orange-600 border-orange-200',
            purple: 'bg-purple-50 text-purple-600 border-purple-200'
          };

          return (
            <Card key={idx} className={`border ${colorClasses[card.color]}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-70">{card.title}</p>
                    <p className="text-2xl font-bold mt-2">{card.value}</p>
                    {card.status !== undefined && (
                      <p className="text-xs mt-2">
                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                        {card.status} {card.statusLabel}
                      </p>
                    )}
                  </div>
                  <Icon className="w-8 h-8 opacity-50" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Anlage V */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Anlage V (Einkünfte aus Vermietung)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Einnahmen und Werbungskosten aus Vermietung erfassen und berechnen.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">{anlagenV.length} Immobilien für {selectedYear}</p>
              <div className="flex gap-2">
                <Link to={createPageUrl('AnlageVDashboard')} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Ansicht
                  </Button>
                </Link>
                <Link to={createPageUrl('AnlageVForm')} className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-1" />
                    Neu
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ELSTER Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              ELSTER XML / DATEV Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Anlage V als XML für ELSTER-Einreichung oder CSV für Steuerberater exportieren.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                XML Generator
              </Button>
              <Button variant="outline" className="flex-1">
                DATEV Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Betriebskosten */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Betriebskostenabrechnung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Betriebskosten erfassen, verteilen und abrechnen (Heizung, Wasser, etc.).
            </p>
            <div>
              <p className="text-sm font-medium">{statements.length} Abrechnungen für {selectedYear}</p>
              <p className="text-xs text-gray-600 mt-1">
                Summe: €{statements.reduce((sum, s) => sum + s.total_costs, 0).toFixed(0)}
              </p>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-1" />
              Neue Abrechnung
            </Button>
          </CardContent>
        </Card>

        {/* Mieterhöhung */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Mieterhöhungs-Tool
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Rechtskonforme Mieterhöhungen berechnen und Anschreiben generieren.
            </p>
            <div>
              <p className="text-sm font-medium">{rentProposals.length} Anträge für {selectedYear}</p>
              {rentProposals.length > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  {rentProposals.filter(p => p.status === 'EFFECTIVE').length} wirksam
                </p>
              )}
            </div>
            <Button className="w-full bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-1" />
              Neue Erhöhung
            </Button>
          </CardContent>
        </Card>

        {/* Abrechnungsfristen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Wichtige Fristen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm space-y-2">
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>Steuererklärung 2024</span>
                <span className="font-medium">31.05.2025</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>Betriebskostenabrechnung</span>
                <span className="font-medium">12 Monate</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>Nebenkostenvorschüsse</span>
                <span className="font-medium">monatlich</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dokumentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Dokumentation & Help
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Rechtliche Anforderungen und Best Practices zur Steuerverwaltung.
            </p>
            <div className="space-y-2 text-sm">
              <p>• BGB §556 - Mieterhöhung (20% in 3 Jahren)</p>
              <p>• GoBD - Buchführungspflichten</p>
              <p>• Betriebskosten-Verordnung (BetrKV)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Aktivitäten</CardTitle>
        </CardHeader>
        <CardContent>
          {anlagenV.length > 0 ? (
            <div className="space-y-3">
              {anlagenV.slice(0, 5).map(anlage => (
                <div key={anlage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{buildings.find(b => b.id === anlage.building_id)?.name}</p>
                    <p className="text-xs text-gray-600">{anlage.tax_year}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">€{anlage.net_income?.toFixed(0)}</p>
                    <p className={`text-xs font-medium ${anlage.status === 'CALCULATED' ? 'text-green-600' : 'text-gray-600'}`}>
                      {anlage.status === 'CALCULATED' ? '✓ Berechnet' : 'Entwurf'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center py-6">
              Noch keine Anlage V für {selectedYear} erstellt
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}