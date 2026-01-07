import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function usePermissions() {
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me()
  });
  
  const checkPermission = async (action, resource, resourceId = null, fieldName = null) => {
    if (!user) return false;
    
    try {
      const response = await base44.functions.invoke('checkUserPermission', {
        userId: user.id,
        action,
        resource,
        resourceId,
        fieldName
      });
      
      return response.data.hasPermission;
    } catch (error) {
      console.error("Permission check failed:", error);
      return false;
    }
  };
  
  const canRead = (resource, resourceId = null) => checkPermission('read', resource, resourceId);
  const canWrite = (resource, resourceId = null) => checkPermission('write', resource, resourceId);
  const canDelete = (resource, resourceId = null) => checkPermission('delete', resource, resourceId);
  const canField = (entity, fieldName, action = 'read') => checkPermission(action, entity, null, fieldName);
  
  return {
    user,
    checkPermission,
    canRead,
    canWrite,
    canDelete,
    canField,
    isAdmin: user?.role === 'admin',
    isTester: user?.is_tester || false
  };
}