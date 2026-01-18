import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building, Home, TrendingUp, AlertCircle } from 'lucide-react';
import QuickActionsWidget from '@/components/dashboard/QuickActionsWidget';
import RevenueWidget from '@/components/widgets/RevenueWidget';
import BuildingsWidget from '@/components/dashboard/widgets/BuildingsWidget';
import UpcomingTasksWidget from '@/components/dashboard/widgets/UpcomingTasksWidget';
import RecentActivityWidget from '@/components/dashboards/RecentActivityWidget';

export default function VermieterDashboard() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => base44.functions.invoke('generateDashboardStats', {})
  });

  const kpis = stats?.data || {
    financial: { monthly_rent: 0, unpaid_invoices: 0 },
    units: { total: 0, occupancy_rate: 0 },
    tasks: { open: 0, overdue: 0 }
  };

  return (
    <div className="vf-dashboard">
      <div className="vf-dashboard__header mb-6">
        <h1 className="vf-dashboard__greeting">Guten Tag, {user?.full_name || 'Vermieter'}! 👋</h1>
        <p className="vf-dashboard__date">
          {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="vf-dashboard__kpis">
        <div className="vf-kpi-card vf-kpi-card--highlighted">
          <div className="vf-kpi-card__value">€{kpis.financial.monthly_rent.toLocaleString('de-DE')}</div>
          <div className="vf-kpi-card__label">Mieteinnahmen/Monat</div>
          <div className="vf-kpi-card__trend vf-kpi-card__trend--positive">↑ 3,2%</div>
        </div>

        <div className="vf-kpi-card">
          <div className="vf-kpi-card__value">{kpis.units.occupancy_rate}%</div>
          <div className="vf-kpi-card__label">Vermietet</div>
          <div className="vf-kpi-card__trend vf-kpi-card__trend--positive">↑ 2 Einh.</div>
        </div>

        <div className="vf-kpi-card">
          <div className="vf-kpi-card__value">€{kpis.financial.total_unpaid?.toLocaleString('de-DE') || 0}</div>
          <div className="vf-kpi-card__label">Offene Forderungen</div>
          {kpis.financial.unpaid_invoices > 0 && (
            <div className="vf-kpi-card__trend vf-kpi-card__trend--warning">
              ⚠️ {kpis.financial.unpaid_invoices} überfällig
            </div>
          )}
        </div>

        <div className="vf-kpi-card">
          <div className="vf-kpi-card__value">{kpis.units.vacant || 0}</div>
          <div className="vf-kpi-card__label">Leerstand</div>
        </div>
      </div>

      <div className="vf-dashboard__grid">
        <div className="space-y-6">
          <RevenueWidget />
          <BuildingsWidget />
          <QuickActionsWidget />
        </div>

        <div className="space-y-6">
          <UpcomingTasksWidget />
          <RecentActivityWidget />
        </div>
      </div>
    </div>
  );
}