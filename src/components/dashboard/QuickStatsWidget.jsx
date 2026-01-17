import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import QuickStatsGrid from '@/components/shared/QuickStatsGrid';
import { Building2, Users, Euro, TrendingUp } from 'lucide-react';

export default function QuickStatsWidget() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateDashboardStats', {});
      return response.data;
    }
  });

  if (!stats) return null;

  const quickStats = [
    { label: 'Objekte', value: stats.buildings?.total || 0, icon: Building2 },
    { label: 'Mieter', value: stats.tenants?.active || 0, icon: Users },
    { label: 'Auslastung', value: `${stats.units?.occupancy_rate || 0}%`, icon: TrendingUp },
    { 
      label: 'Netto-Einnahmen', 
      value: `€${(stats.financial?.net_income || 0).toLocaleString()}`,
      icon: Euro,
      variant: 'highlighted'
    }
  ];

  return <QuickStatsGrid stats={quickStats} />;
}