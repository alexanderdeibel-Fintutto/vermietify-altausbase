import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function usePermissionCheck() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: userAccess = [] } = useQuery({
    queryKey: ['userPermissions', user?.email],
    queryFn: () => base44.entities.UserMandantAccess.filter({ 
      user_email: user.email,
      ist_aktiv: true
    }),
    enabled: !!user?.email && user.role !== 'admin'
  });

  const hasPermission = (module, action) => {
    // Admins have all permissions
    if (user?.role === 'admin') return true;

    // Check user's role permissions
    for (const access of userAccess) {
      const permissions = JSON.parse(access.berechtigungen || '{}');
      if (permissions[module]?.includes(action)) {
        return true;
      }
    }

    return false;
  };

  const hasBuildingAccess = (buildingId) => {
    // Admins have access to all buildings
    if (user?.role === 'admin') return true;

    // Check if user has access to this specific building
    for (const access of userAccess) {
      const allowedBuildings = JSON.parse(access.gebaeude_zugriff || '[]');
      
      // Empty array means access to all buildings
      if (allowedBuildings.length === 0) return true;
      
      // Check if building is in allowed list
      if (allowedBuildings.includes(buildingId)) return true;
    }

    return false;
  };

  const getAllowedBuildings = () => {
    // Admins have access to all buildings
    if (user?.role === 'admin') return null; // null = all buildings

    const allowedIds = new Set();

    for (const access of userAccess) {
      const buildingIds = JSON.parse(access.gebaeude_zugriff || '[]');
      
      // If any role has empty array, user has access to all
      if (buildingIds.length === 0) return null;
      
      buildingIds.forEach(id => allowedIds.add(id));
    }

    return Array.from(allowedIds);
  };

  return {
    user,
    userAccess,
    hasPermission,
    hasBuildingAccess,
    getAllowedBuildings,
    isAdmin: user?.role === 'admin'
  };
}