import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatGrid from '@/components/stats/StatGrid';
import { Building2, Home, Users, Euro } from 'lucide-react';

export default function BuildingStats({ buildingId }) {
  const { data: units = [] } = useQuery({
    queryKey: ['units', buildingId],
    queryFn: async () => {
      const allUnits = await base44.entities.Unit.list();
      return allUnits.filter(u => u.building_id === buildingId);
    }
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', buildingId],
    queryFn: async () => {
      const allContracts = await base44.entities.LeaseContract.list();
      return allContracts.filter(c => 
        units.some(u => u.id === c.unit_id)
      );
    },
    enabled: units.length > 0
  });

  const occupiedUnits = units.filter(u => 
    contracts.some(c => c.unit_id === u.id && c.status === 'active')
  );

  const totalRent = contracts
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + (c.rent_cold || 0), 0);

  const stats = [
    { label: 'Einheiten', value: units.length, icon: Home },
    { label: 'Vermietet', value: occupiedUnits.length, icon: Users },
    { label: 'Auslastung', value: `${Math.round((occupiedUnits.length / units.length) * 100)}%`, icon: Building2 },
    { label: 'Mieteinnahmen', value: `€${totalRent.toLocaleString()}`, icon: Euro, variant: 'highlighted' }
  ];

  return <StatGrid stats={stats} columns={4} />;
}