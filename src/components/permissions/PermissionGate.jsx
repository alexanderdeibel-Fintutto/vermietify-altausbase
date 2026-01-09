import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

/**
 * Component that renders content only if user has the required permission
 */
export default function PermissionGate({ 
  permission, 
  children, 
  fallback = null,
  requireAll = false 
}) {
  const permissions = Array.isArray(permission) ? permission : [permission];

  const { data, isLoading } = useQuery({
    queryKey: ['userPermission', permissions.join(',')],
    queryFn: async () => {
      if (requireAll) {
        // Check all permissions
        const results = await Promise.all(
          permissions.map(p =>
            base44.functions.invoke('checkUserPermission', { permission_code: p })
          )
        );
        return results.every(r => r.data?.has_permission);
      } else {
        // Check at least one permission
        const results = await Promise.all(
          permissions.map(p =>
            base44.functions.invoke('checkUserPermission', { permission_code: p })
          )
        );
        return results.some(r => r.data?.has_permission);
      }
    },
    staleTime: 5 * 60 * 1000
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return fallback;
  }

  return children;
}