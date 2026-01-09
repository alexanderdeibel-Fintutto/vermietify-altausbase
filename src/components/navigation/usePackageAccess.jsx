import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function usePackageAccess() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  const { data: packageConfig } = useQuery({
    queryKey: ['packageConfig', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const configs = await base44.entities.UserPackageConfiguration.filter({ user_id: user.id });
      return configs[0];
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000
  });

  const checkFeatureAccess = (featureKey) => {
    if (!packageConfig) return false;
    
    const packageFeatures = {
      easyKonto: ['dashboard', 'finanzen'],
      easySteuer: ['dashboard', 'finanzen', 'steuer', 'elster'],
      easyHome: ['dashboard', 'finanzen', 'immobilien'],
      easyVermieter: ['dashboard', 'finanzen', 'immobilien', 'mieter', 'steuer', 'betriebskostenabrechnung'],
      easyGewerbe: ['dashboard', 'finanzen', 'immobilien', 'mieter', 'steuer', 'firma', 'elster']
    };

    const baseFeatures = packageFeatures[packageConfig.package_type] || [];
    const addonFeatures = packageConfig.additional_modules || [];
    
    return baseFeatures.includes(featureKey) || addonFeatures.includes(featureKey);
  };

  const checkBuildingLimit = (currentCount) => {
    if (!packageConfig) return { allowed: false, limit: 0 };
    return {
      allowed: currentCount < packageConfig.max_buildings,
      limit: packageConfig.max_buildings,
      current: currentCount
    };
  };

  const checkUnitLimit = (currentCount) => {
    if (!packageConfig) return { allowed: false, limit: 0 };
    return {
      allowed: currentCount < packageConfig.max_units,
      limit: packageConfig.max_units,
      current: currentCount
    };
  };

  return {
    user,
    packageConfig,
    checkFeatureAccess,
    checkBuildingLimit,
    checkUnitLimit,
    isLoading: !user || !packageConfig
  };
}