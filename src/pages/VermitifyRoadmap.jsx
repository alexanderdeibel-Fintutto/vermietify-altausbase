import React from 'react';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VermitifyRoadmap() {
  const phases = [
    {
      phase: 'Q1 2026',
      status: 'done',
      items: [
        { title: 'Design System', done: true },
        { title: 'Kostenlose Tools (9 Rechner)', done: true },
        { title: 'Objektverwaltung', done: true },
        { title: 'Mieterverwaltung', done: true },
        { title: 'Vertragsmanagement', done: true }
      ]
    },
    {
      phase: 'Q2 2026',
      status: 'in_progress',
      items: [
        { title: 'Mobile App (iOS & Android)', done: false },
        { title: 'WhatsApp-Integration', done: false },
        { title: 'DATEV-Schnittstelle', done: false },
        { title: 'Multi-Objekt BK-Abrechnung', done: false }
      ]
    },
    {
      phase: 'Q3 2026',
      status: 'planned',
      items: [
        { title: 'KI-Assistent für Vermieter', done: false },
        { title: 'Mieterportal 2.0', done: false },
        { title: 'Smart Home Integration', done: false },
        { title: 'Predictive Maintenance', done: false }
      ]
    },
    {
      phase: 'Q4 2026',
      status: 'planned',
      items: [
        { title: 'Marketplace für Dienstleister', done: false },
        { title: 'White-Label für Verwalter', done: false },
        { title: 'API v2', done: false }
      ]
    }
  ];

  return (
    <VfMarketingLayout>
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Roadmap</h1>
          <p className="text-xl text-[var(--theme-text-secondary)]">
            Die Zukunft von vermitify - transparent und öffentlich
          </p>
        </div>

        <div className="space-y-8">
          {phases.map((phase, phaseIndex) => {
            const statusIcons = {
              done: CheckCircle,
              in_progress: Clock,
              planned: Circle
            };
            const StatusIcon = statusIcons[phase.status];
            
            return (
              <Card key={phaseIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <StatusIcon className={cn(
                      "h-6 w-6",
                      phase.status === 'done' && "text-[var(--vf-success-500)]",
                      phase.status === 'in_progress' && "text-[var(--vf-warning-500)]",
                      phase.status === 'planned' && "text-[var(--vf-neutral-400)]"
                    )} />
                    {phase.phase}
                    <span className={cn(
                      "vf-badge ml-auto",
                      phase.status === 'done' && "vf-badge-success",
                      phase.status === 'in_progress' && "vf-badge-warning",
                      phase.status === 'planned' && "vf-badge-default"
                    )}>
                      {phase.status === 'done' ? 'Fertig' : 
                       phase.status === 'in_progress' ? 'In Arbeit' : 'Geplant'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {phase.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center gap-3">
                        {item.done ? (
                          <CheckCircle className="h-5 w-5 text-[var(--vf-success-500)]" />
                        ) : (
                          <Circle className="h-5 w-5 text-[var(--vf-neutral-300)]" />
                        )}
                        <span className={item.done ? 'text-[var(--theme-text-muted)]' : ''}>
                          {item.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[var(--theme-text-secondary)] mb-4">
            Haben Sie Feature-Wünsche? Lassen Sie es uns wissen!
          </p>
          <a href="mailto:feedback@vermitify.de" className="vf-btn vf-btn-gradient vf-btn-md">
            Feedback senden
          </a>
        </div>
      </div>
    </VfMarketingLayout>
  );
}