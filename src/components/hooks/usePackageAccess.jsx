import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCallback } from 'react';

export function usePackageAccess() {
  // Hole User's Package Configuration
  const { data: packageConfig, isLoading } = useQuery({
    queryKey: ['user-package-config'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return null;

      const configs = await base44.entities.UserPackageConfiguration.filter({
        user_id: user.id,
        is_active: true
      });

      return configs[0] || null;
    }
  });

  // Hole Package Template
  const { data: packageTemplate } = useQuery({
    queryKey: ['package-template', packageConfig?.package_type],
    queryFn: () => {
      if (!packageConfig) return null;
      return base44.asServiceRole.entities.PackageTemplate.filter({
        package_type: packageConfig.package_type,
        is_active: true
      }).then(t => t[0] || null);
    },
    enabled: !!packageConfig
  });

  // Check ob User Zugriff auf Modul hat
  const hasModuleAccess = useCallback((moduleName) => {
    if (!packageTemplate) return false;
    
    const isIncluded = packageTemplate.included_modules?.includes(moduleName);
    const isAddon = packageConfig?.additional_modules?.includes(moduleName);
    
    return isIncluded || isAddon;
  }, [packageTemplate, packageConfig]);

  // Prüfe Limits (z.B. max buildings)
  const canCreateBuilding = useCallback(async (currentCount = 0) => {
    if (!packageConfig) return false;
    return currentCount < packageConfig.max_buildings;
  }, [packageConfig]);

  const canCreateUnit = useCallback(async (currentCount = 0) => {
    if (!packageConfig) return false;
    return currentCount < packageConfig.max_units;
  }, [packageConfig]);

  return {
    packageConfig,
    packageTemplate,
    isLoading,
    hasModuleAccess,
    canCreateBuilding,
    canCreateUnit,
    packageType: packageConfig?.package_type || 'easyVermieter'
  };
}