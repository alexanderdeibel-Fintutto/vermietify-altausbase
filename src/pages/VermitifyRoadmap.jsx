import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock } from 'lucide-react';

export default function VermitifyRoadmap() {
  const roadmap = [
    {
      quarter: 'Q1 2026',
      status: 'current',
      features: [
        { name: 'Erweiterte KI-Dokumenten-Analyse', status: 'in_progress' },
        { name: 'Mobile App (iOS & Android)', status: 'in_progress' },
        { name: 'DATEV-Integration', status: 'planned' },
        { name: 'Automatische Mieterhöhungen', status: 'completed' }
      ]
    },
    {
      quarter: 'Q2 2026',
      status: 'planned',
      features: [
        { name: 'Multi-Währungs-Support', status: 'planned' },
        { name: 'Erweiterte Reporting-Dashboards', status: 'planned' },
        { name: 'Integration mit Immobilienportalen', status: 'planned' },
        { name: 'White-Label Lösung', status: 'planned' }
      ]
    },
    {
      quarter: 'Q3 2026',
      status: 'planned',
      features: [
        { name: 'IoT-Integration (Smart Home)', status: 'planned' },
        { name: 'Blockchain-basierte Verträge', status: 'planned' },
        { name: 'Predictive Analytics', status: 'planned' },
        { name: 'API für Drittanbieter', status: 'planned' }
      ]
    },
    {
      quarter: 'Q4 2026',
      status: 'planned',
      features: [
        { name: 'Mandanten-Management', status: 'planned' },
        { name: 'Enterprise-Features', status: 'planned' },
        { name: 'Erweiterte Compliance-Tools', status: 'planned' }
      ]
    }
  ];

  const statusConfig = {
    completed: { icon: CheckCircle, label: 'Fertig', color: 'vf-badge-success' },
    in_progress: { icon: Clock, label: 'In Arbeit', color: 'vf-badge-warning' },
    planned: { icon: Circle, label: 'Geplant', color: 'vf-badge-default' }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-background)] py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 vf-gradient-text">Produkt-Roadmap</h1>
          <p className="text-lg text-[var(--theme-text-secondary)]">
            Hier sehen Sie, woran wir arbeiten und was als nächstes kommt
          </p>
        </div>

        <div className="space-y-8">
          {roadmap.map((quarter) => (
            <div key={quarter.quarter}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold">{quarter.quarter}</h2>
                {quarter.status === 'current' && (
                  <Badge className="vf-badge-accent">Aktuell</Badge>
                )}
              </div>

              <div className="grid gap-3">
                {quarter.features.map((feature) => {
                  const config = statusConfig[feature.status];
                  const Icon = config.icon;
                  
                  return (
                    <Card key={feature.name}>
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${
                            feature.status === 'completed' ? 'text-[var(--vf-success-500)]' :
                            feature.status === 'in_progress' ? 'text-[var(--vf-warning-500)]' :
                            'text-[var(--theme-text-muted)]'
                          }`} />
                          <span className="font-medium">{feature.name}</span>
                        </div>
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}