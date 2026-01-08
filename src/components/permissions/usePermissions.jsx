import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";

export function usePermissions() {
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me()
  });
  
  const { data: userPermissions } = useQuery({
    queryKey: ["user-permissions", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const response = await base44.functions.invoke('getUserRolesAndPermissions', {
        userId: user.id
      });
      return response.data;
    },
    enabled: !!user
  });
  
  const checkPermission = async (action, resource, resourceId = null, fieldName = null) => {
    if (!user || !userPermissions) return false;
    
    // Wildcard check
    if (userPermissions.hasWildcard) return true;
    
    // Permission code check
    const permissionCode = `${resource}_${action}`;
    const hasPermission = userPermissions.permissions.some(p => 
      p.code === permissionCode || 
      p.code === `${resource}_all` ||
      (p.resource === resource && p.action === action)
    );
    
    if (!hasPermission) return false;
    
    // Building restriction check
    if (resourceId && resource === "buildings" && userPermissions.buildingRestrictions) {
      return userPermissions.buildingRestrictions.includes(resourceId);
    }
    
    // Field permission check
    if (fieldName) {
      const fieldPerm = userPermissions.fieldPermissions.find(fp => 
        fp.entity_name === resource && fp.field_name === fieldName
      );
      
      if (!fieldPerm) return false;
      
      const levelMap = {
        'read': ['read', 'write', 'admin'],
        'write': ['write', 'admin'],
        'admin': ['admin']
      };
      
      return levelMap[action]?.includes(fieldPerm.access_level);
    }
    
    return true;
  };
  
  return {
    user,
    userPermissions,
    checkPermission,
    canRead: (resource, resourceId = null) => checkPermission('read', resource, resourceId),
    canWrite: (resource, resourceId = null) => checkPermission('write', resource, resourceId),
    canDelete: (resource, resourceId = null) => checkPermission('delete', resource, resourceId),
    canField: (entity, fieldName, action = 'read') => checkPermission(action, entity, null, fieldName),
    isAdmin: user?.role === 'admin',
    isTester: user?.is_tester || false,
    roles: userPermissions?.roles || [],
    permissions: userPermissions?.permissions || []
  };
}