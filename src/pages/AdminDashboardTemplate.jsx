import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfDashboard, VfKpiCard, VfDashboardWidget } from '@/components/dashboards/VfDashboard';
import { Users, Building2, Euro, TrendingUp } from 'lucide-react';

export default function AdminDashboardTemplate() {
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['all-buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['all-units'],
    queryFn: () => base44.entities.Unit.list()
  });

  const activeUsers = allUsers.filter(u => {
    const lastActive = new Date(u.updated_date);
    const daysSince = (new Date() - lastActive) / (1000 * 60 * 60 * 24);
    return daysSince <= 30;
  }).length;

  return (
    <VfDashboard
      greeting="Admin Dashboard 🎯"
      date={new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      kpis={[
        {
          label: 'Gesamt-Nutzer',
          value: allUsers.length,
          trend: 'up',
          trendValue: `${activeUsers} aktiv`,
          icon: Users
        },
        {
          label: 'Objekte',
          value: buildings.length,
          icon: Building2
        },
        {
          label: 'Einheiten',
          value: units.length,
          icon: Building2
        },
        {
          label: 'Umsatz (Monat)',
          value: '€12.450',
          trend: 'up',
          trendValue: '↑ 8,3%',
          icon: Euro,
          highlighted: true
        }
      ]}
    >
      <div className="vf-dashboard__grid">
        <VfDashboardWidget title="Neue Registrierungen (30 Tage)">
          <div className="space-y-2">
            {allUsers.slice(0, 5).map((user) => (
              <div key={user.id} className="flex justify-between items-center py-2 border-b border-[var(--theme-divider)] last:border-0">
                <div>
                  <div className="font-medium">{user.full_name}</div>
                  <div className="text-sm text-[var(--theme-text-muted)]">{user.email}</div>
                </div>
                <div className="text-sm text-[var(--theme-text-muted)]">
                  {new Date(user.created_date).toLocaleDateString('de-DE')}
                </div>
              </div>
            ))}
          </div>
        </VfDashboardWidget>

        <VfDashboardWidget title="System-Status">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Datenbank</span>
              <span className="vf-badge vf-badge-success">✓ Online</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">API</span>
              <span className="vf-badge vf-badge-success">✓ Online</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">ELSTER</span>
              <span className="vf-badge vf-badge-success">✓ Online</span>
            </div>
          </div>
        </VfDashboardWidget>
      </div>
    </VfDashboard>
  );
}