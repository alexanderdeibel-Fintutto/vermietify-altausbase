import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wrench, Bug, Shield } from 'lucide-react';

export default function VermitifyChangelog() {
  const releases = [
    {
      version: '2.1.0',
      date: '2026-01-15',
      changes: [
        { type: 'feature', text: 'Vollständiger BK-Abrechnungs-Wizard mit BetrKV-Compliance' },
        { type: 'feature', text: 'Anlage V Generator mit ELSTER-Export' },
        { type: 'feature', text: 'KI-gestützte Dokumenten-Kategorisierung' },
        { type: 'improvement', text: 'Verbesserte mobile Navigation' }
      ]
    },
    {
      version: '2.0.0',
      date: '2025-12-20',
      changes: [
        { type: 'feature', text: 'Mieter-Portal mit Self-Service' },
        { type: 'feature', text: 'finAPI Banking-Integration' },
        { type: 'feature', text: 'Automatische Zahlungszuordnung' },
        { type: 'improvement', text: 'Redesign der Benutzeroberfläche' },
        { type: 'bugfix', text: 'Fehler bei Mieterhöhungen behoben' }
      ]
    },
    {
      version: '1.5.0',
      date: '2025-11-10',
      changes: [
        { type: 'feature', text: 'Multi-Objekt-Verwaltung' },
        { type: 'feature', text: 'Aufgaben-Management mit Workflows' },
        { type: 'security', text: 'Zwei-Faktor-Authentifizierung' }
      ]
    }
  ];

  const typeConfig = {
    feature: { icon: Sparkles, label: 'Neu', color: 'vf-badge-success' },
    improvement: { icon: Wrench, label: 'Verbesserung', color: 'vf-badge-info' },
    bugfix: { icon: Bug, label: 'Bugfix', color: 'vf-badge-warning' },
    security: { icon: Shield, label: 'Sicherheit', color: 'vf-badge-error' }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-background)] py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 vf-gradient-text">Changelog</h1>
          <p className="text-lg text-[var(--theme-text-secondary)]">
            Alle Neuerungen und Verbesserungen auf einen Blick
          </p>
        </div>

        <div className="space-y-6">
          {releases.map((release) => (
            <Card key={release.version}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">Version {release.version}</h2>
                    <p className="text-sm text-[var(--theme-text-muted)]">
                      {new Date(release.date).toLocaleDateString('de-DE', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {release.changes.map((change, idx) => {
                    const config = typeConfig[change.type];
                    const Icon = config.icon;
                    
                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`vf-badge ${config.color} flex items-center gap-1`}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </div>
                        <span className="flex-1 text-sm">{change.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}