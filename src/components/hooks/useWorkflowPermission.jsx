import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useWorkflowPermission(workflowId, permissionType = 'view') {
  const { data: result = {}, isLoading, error } = useQuery({
    queryKey: ['workflow-permission', workflowId, permissionType],
    queryFn: () =>
      base44.functions.invoke('checkWorkflowPermission', {
        workflow_id: workflowId,
        permission_type: permissionType
      }).then(res => res.data),
    staleTime: 60 * 1000 // Cache for 1 minute
  });

  return {
    hasPermission: result.has_permission || false,
    source: result.source,
    expiresAt: result.expires_at,
    isLoading,
    error
  };
}