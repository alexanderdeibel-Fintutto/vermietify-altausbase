import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useBuildingStats() {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list()
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  // Berechne Stats pro Gebäude
  const buildingStats = buildings.map(building => {
    const buildingUnits = units.filter(u => u.building_id === building.id);
    const activeLeases = leases.filter(
      l => buildingUnits.some(u => u.id === l.unit_id) && l.status === 'active'
    );

    const totalUnits = buildingUnits.length;
    const rentedUnits = activeLeases.length;
    const occupancy = totalUnits > 0 ? Math.round((rentedUnits / totalUnits) * 100) : 0;
    const totalRent = activeLeases.reduce((sum, l) => sum + (l.base_rent || 0), 0);

    return {
      building,
      totalUnits,
      rentedUnits,
      occupancy,
      totalRent,
      cities: [...new Set(buildings.map(b => b.city).filter(Boolean))]
    };
  });

  // Gesamt-Statistiken
  const totalBuildings = buildings.length;
  const totalUnitsCount = units.length;
  const totalRentedUnits = leases.filter(l => l.status === 'active').length;
  const totalRevenue = leases
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + (l.base_rent || 0), 0);

  return {
    buildingStats,
    buildings,
    units,
    leases,
    totalBuildings,
    totalUnitsCount,
    totalRentedUnits,
    totalRevenue
  };
}