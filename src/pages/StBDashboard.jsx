import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfDashboard, VfKpiCard, VfDashboardWidget, VfDueItem } from '@/components/dashboards/VfDashboard';
import { FileText, Building2, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function StBDashboard() {
  const { data: anlagenV = [] } = useQuery({
    queryKey: ['anlage-v-all'],
    queryFn: () => base44.entities.AnlageV.list()
  });

  const pendingCount = anlagenV.filter(a => a.status === 'DRAFT').length;
  const completedThisYear = anlagenV.filter(a => {
    return a.status === 'SUBMITTED' && a.tax_year === new Date().getFullYear();
  }).length;

  return (
    <div className="theme-b2b">
      <VfDashboard
        greeting="Steuerberater Dashboard 📊"
        date={new Date().toLocaleDateString('de-DE')}
        kpis={[
          {
            label: 'Mandanten',
            value: anlagenV.length,
            icon: Building2
          },
          {
            label: 'Offen',
            value: pendingCount,
            trend: pendingCount > 0 ? 'warning' : 'up',
            trendValue: 'Zu bearbeiten',
            icon: Clock
          },
          {
            label: 'Erledigt (2026)',
            value: completedThisYear,
            icon: CheckCircle
          },
          {
            label: 'Frist',
            value: '31.05.',
            trend: 'warning',
            trendValue: 'in 134 Tagen',
            icon: FileText,
            highlighted: true
          }
        ]}
      >
        <div className="vf-dashboard__grid">
          <VfDashboardWidget
            title="Mandanten-Übersicht"
            footer={
              <button className="text-sm text-[var(--theme-primary)] hover:underline">
                Alle Mandanten →
              </button>
            }
          >
            <div className="space-y-2">
              {anlagenV.slice(0, 8).map((anlage) => (
                <Card key={anlage.id} className="vf-card-clickable">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Objekt {anlage.building_id.substring(0, 8)}</div>
                        <div className="text-sm text-[var(--theme-text-muted)]">
                          Steuerjahr {anlage.tax_year}
                        </div>
                      </div>
                      <span className={
                        anlage.status === 'SUBMITTED' ? 'vf-badge vf-badge-success' :
                        anlage.status === 'CALCULATED' ? 'vf-badge vf-badge-warning' :
                        'vf-badge vf-badge-default'
                      }>
                        {anlage.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </VfDashboardWidget>

          <VfDashboardWidget title="Nächste Fristen">
            <VfDueItem
              priority="urgent"
              title="Anlage V - Mandant A"
              subtitle="Fällig in 5 Tagen"
            />
            <VfDueItem
              priority="warning"
              title="Anlage V - Mandant B"
              subtitle="Fällig in 14 Tagen"
            />
            <VfDueItem
              priority="normal"
              title="Anlage V - Mandant C"
              subtitle="Fällig in 30 Tagen"
            />
          </VfDashboardWidget>
        </div>
      </VfDashboard>
    </div>
  );
}