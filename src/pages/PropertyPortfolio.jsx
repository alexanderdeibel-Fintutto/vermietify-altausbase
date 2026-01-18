import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import BuildingCard from '@/components/buildings/BuildingCard';
import QuickStatsGrid from '@/components/shared/QuickStatsGrid';
import { Building, Home, TrendingUp } from 'lucide-react';

export default function PropertyPortfolio() {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const stats = [
    { label: 'Objekte', value: buildings.length, icon: Building },
    { label: 'Einheiten', value: 24, icon: Home },
    { label: 'Ø Rendite', value: '7.2%', icon: TrendingUp }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Immobilien-Portfolio"
        subtitle="Übersicht Ihrer Objekte"
      />

      <QuickStatsGrid stats={stats} className="mt-6" />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {buildings.map((building) => (
          <BuildingCard key={building.id} building={building} />
        ))}
      </div>
    </div>
  );
}