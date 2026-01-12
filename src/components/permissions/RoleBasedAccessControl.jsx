import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Hook to check user's role-based permissions
 */
export function useRolePermissions() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: mandantAccess = [] } = useQuery({
    queryKey: ['mandantAccess', user?.email],
    queryFn: () => base44.entities.UserMandantAccess.filter({ 
      user_email: user.email,
      ist_aktiv: true 
    }),
    enabled: !!user?.email
  });

  const hasPermission = (resource, action) => {
    if (user?.role === 'admin') return true;

    const access = mandantAccess[0];
    if (!access) return false;

    const rolle = access.rolle;

    // Role-based permissions matrix
    const permissionsMatrix = {
      'Objekt-Manager': {
        buildings: ['read', 'create', 'update'],
        units: ['read', 'create', 'update'],
        contracts: ['read', 'create', 'update'],
        tenants: ['read', 'create', 'update'],
        finances: ['read'],
        documents: ['read', 'create'],
        tasks: ['read', 'create', 'update']
      },
      'Buchhaltung': {
        finances: ['read', 'create', 'update', 'approve'],
        invoices: ['read', 'create', 'update'],
        documents: ['read'],
        buildings: ['read'],
        contracts: ['read']
      },
      'Hausmeister': {
        tasks: ['read', 'create', 'update'],
        buildings: ['read'],
        units: ['read'],
        documents: ['read', 'create']
      },
      'Steuerberater': {
        finances: ['read'],
        tax: ['read', 'generate', 'export'],
        buildings: ['read'],
        documents: ['read']
      },
      'Externer Prüfer': {
        audit: ['read'],
        finances: ['read'],
        buildings: ['read'],
        contracts: ['read']
      },
      'Admin': {
        '*': ['read', 'create', 'update', 'delete', 'approve']
      }
    };

    const rolePermissions = permissionsMatrix[rolle];
    if (!rolePermissions) return false;

    if (rolePermissions['*']) {
      return rolePermissions['*'].includes(action);
    }

    return rolePermissions[resource]?.includes(action) || false;
  };

  const canAccessBuilding = (buildingId) => {
    if (user?.role === 'admin') return true;

    const access = mandantAccess[0];
    if (!access) return false;

    try {
      const allowedBuildings = JSON.parse(access.gebaeude_zugriff || '[]');
      if (allowedBuildings.length === 0) return true;
      return allowedBuildings.includes(buildingId);
    } catch {
      return true;
    }
  };

  return {
    user,
    mandantAccess: mandantAccess[0],
    hasPermission,
    canAccessBuilding
  };
}

/**
 * Component wrapper for permission-based rendering
 */
export function PermissionGuard({ resource, action, children, fallback = null }) {
  const { hasPermission } = useRolePermissions();

  if (!hasPermission(resource, action)) {
    return fallback;
  }

  return <>{children}</>;
}