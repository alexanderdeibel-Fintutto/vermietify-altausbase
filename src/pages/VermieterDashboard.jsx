import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfDashboard, VfKpiCard, VfDashboardWidget, VfBuildingMini, VfDueItem, VfQuickActions } from '@/components/dashboards/VfDashboard';
import { VfActivityFeed } from '@/components/activity/VfActivityFeed';
import { Building2, Euro, TrendingUp, AlertCircle, Home, Users, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function VermieterDashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  // Calculate KPIs
  const totalRent = contracts
    .filter(c => c.status === 'aktiv')
    .reduce((sum, c) => sum + (c.total_rent || 0), 0);
  
  const occupiedUnits = units.filter(u => u.status === 'vermietet').length;
  const totalUnits = units.length;
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
  
  const vacantUnits = units.filter(u => u.status === 'leer').length;

  const greeting = `Guten ${new Date().getHours() < 12 ? 'Morgen' : new Date().getHours() < 18 ? 'Tag' : 'Abend'}, ${user?.full_name || 'Vermieter'}! 👋`;
  const today = new Date().toLocaleDateString('de-DE', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <VfDashboard
      greeting={greeting}
      date={today}
      kpis={[
        {
          label: 'Mieteinnahmen',
          value: `${totalRent.toLocaleString('de-DE')} €`,
          trend: 'up',
          trendValue: '↑ 3,2%',
          icon: Euro
        },
        {
          label: 'Vermietungsquote',
          value: `${Math.round(occupancyRate)}%`,
          trend: occupancyRate >= 90 ? 'up' : 'warning',
          trendValue: `${occupiedUnits}/${totalUnits} Einheiten`,
          highlighted: occupancyRate >= 95
        },
        {
          label: 'Objekte',
          value: buildings.length,
          icon: Building2
        },
        {
          label: 'Leerstand',
          value: vacantUnits,
          trend: vacantUnits > 0 ? 'warning' : 'up',
          trendValue: vacantUnits > 0 ? 'Aktion erforderlich' : 'Alles vermietet',
          icon: Home
        }
      ]}
    >
      <div className="vf-dashboard__grid">
        {/* Left Column */}
        <div className="space-y-6">
          <VfDashboardWidget
            title="Meine Objekte"
            footer={
              <Link to={createPageUrl('Buildings')}>
                <button className="text-sm text-[var(--theme-primary)] hover:underline">
                  Alle Objekte anzeigen →
                </button>
              </Link>
            }
          >
            {buildings.slice(0, 5).map((building) => {
              const buildingUnits = units.filter(u => u.building_id === building.id);
              const occupiedCount = buildingUnits.filter(u => u.status === 'vermietet').length;
              const progress = buildingUnits.length > 0 
                ? (occupiedCount / buildingUnits.length) * 100 
                : 0;
              
              return (
                <Link key={building.id} to={createPageUrl('BuildingDetail') + `?id=${building.id}`}>
                  <VfBuildingMini
                    icon={Building2}
                    name={building.name}
                    meta={`${occupiedCount}/${buildingUnits.length} vermietet`}
                    progress={progress}
                  />
                </Link>
              );
            })}
          </VfDashboardWidget>

          <VfDashboardWidget title="Quick Actions">
            <VfQuickActions
              actions={[
                { label: 'Neues Objekt', icon: Plus, onClick: () => {} },
                { label: 'Neuer Mieter', icon: Users, onClick: () => {} },
                { label: 'Neues Dokument', icon: FileText, onClick: () => {} }
              ]}
            />
          </VfDashboardWidget>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <VfDashboardWidget
            title="Nächste Fälligkeiten"
            footer={
              <button className="text-sm text-[var(--theme-primary)] hover:underline">
                Alle Fälligkeiten →
              </button>
            }
          >
            <VfDueItem
              priority="urgent"
              title="Miete Müller"
              subtitle="Überfällig seit 5 Tagen"
              amount="850 €"
            />
            <VfDueItem
              priority="warning"
              title="Grundsteuer Q1"
              subtitle="Fällig in 3 Tagen"
              amount="420 €"
            />
            <VfDueItem
              priority="normal"
              title="Versicherung"
              subtitle="Fällig in 12 Tagen"
              amount="890 €"
            />
          </VfDashboardWidget>

          <VfDashboardWidget title="Letzte Aktivität">
            <VfActivityFeed limit={5} groupByDay={false} />
          </VfDashboardWidget>
        </div>
      </div>
    </VfDashboard>
  );
}