import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfDashboard } from '@/components/dashboards/VfDashboard';
import QuickStatsGrid from '@/components/shared/QuickStatsGrid';
import TaskDashboard from '@/components/tasks/TaskDashboard';
import FavoritesWidget from './FavoritesWidget';
import RecentActivityWidget from '@/components/dashboards/RecentActivityWidget';
import UpcomingDeadlinesWidget from '@/components/dashboards/UpcomingDeadlinesWidget';
import { Building2, Users, FileText, Euro } from 'lucide-react';

export default function PersonalDashboard() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const stats = [
    { label: 'Objekte', value: buildings.length, icon: Building2 },
    { label: 'Mieter', value: tenants.length, icon: Users },
    { label: 'Verträge', value: contracts.length, icon: FileText },
    { 
      label: 'Mieteinnahmen', 
      value: `€${contracts.filter(c => c.status === 'active').reduce((s, c) => s + (c.rent_cold || 0), 0).toLocaleString()}`,
      icon: Euro,
      variant: 'highlighted'
    }
  ];

  return (
    <VfDashboard
      greeting={`Willkommen zurück, ${user?.full_name?.split(' ')[0] || 'Vermieter'}!`}
      date={new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    >
      <QuickStatsGrid stats={stats} />

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <TaskDashboard />
        <UpcomingDeadlinesWidget />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <FavoritesWidget />
        <RecentActivityWidget limit={5} />
      </div>
    </VfDashboard>
  );
}