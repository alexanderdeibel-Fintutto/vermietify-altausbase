import { usePermissions } from "@/hooks/usePermissions";
import { useEffect, useState } from "react";

export default function PermissionGate({ 
  action, 
  resource, 
  resourceId = null, 
  fieldName = null, 
  fallback = null, 
  children 
}) {
  const { checkPermission } = usePermissions();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkPerm = async () => {
      const result = await checkPermission(action, resource, resourceId, fieldName);
      setHasPermission(result);
      setLoading(false);
    };
    
    checkPerm();
  }, [action, resource, resourceId, fieldName]);
  
  if (loading) return null;
  if (!hasPermission) return fallback;
  
  return <>{children}</>;
}