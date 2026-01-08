import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Hook zum Validieren von Building/Unit Limits
 */
export function useBuildingLimitValidator() {
  const { data: packageConfig } = useQuery({
    queryKey: ['user-package'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return null;
      const result = await base44.entities.UserPackageConfiguration.filter({ 
        user_id: user.id
      });
      return result[0];
    }
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-count'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units-count'],
    queryFn: () => base44.entities.Unit.list()
  });

  const canCreateBuilding = () => {
    if (!packageConfig) return true;
    return buildings.length < packageConfig.max_buildings;
  };

  const canCreateUnit = () => {
    if (!packageConfig) return true;
    return units.length < packageConfig.max_units;
  };

  const getRemainingBuildings = () => {
    if (!packageConfig) return 0;
    return Math.max(0, packageConfig.max_buildings - buildings.length);
  };

  const getRemainingUnits = () => {
    if (!packageConfig) return 0;
    return Math.max(0, packageConfig.max_units - units.length);
  };

  const getBuildingUsagePercentage = () => {
    if (!packageConfig || packageConfig.max_buildings === 0) return 0;
    return Math.round((buildings.length / packageConfig.max_buildings) * 100);
  };

  const getUnitUsagePercentage = () => {
    if (!packageConfig || packageConfig.max_units === 0) return 0;
    return Math.round((units.length / packageConfig.max_units) * 100);
  };

  return {
    packageConfig,
    buildings,
    units,
    canCreateBuilding,
    canCreateUnit,
    getRemainingBuildings,
    getRemainingUnits,
    getBuildingUsagePercentage,
    getUnitUsagePercentage
  };
}