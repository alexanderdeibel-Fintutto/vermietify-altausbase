import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Hook to check user permissions
 */
export function usePermissions() {
  const { data, isLoading } = useQuery({
    queryKey: ['userPermissions'],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('checkUserPermission', {
          permission_code: 'view_financial_data'
        });
        return {
          user_role: response.data?.user_role || 'User',
          permissions: response.data?.user_permissions || [],
          isAdmin: response.data?.user_role === 'Admin'
        };
      } catch (error) {
        console.error('Error fetching permissions:', error);
        return {
          user_role: 'User',
          permissions: [],
          isAdmin: false
        };
      }
    },
    staleTime: 10 * 60 * 1000
  });

  const hasPermission = (permission) => {
    if (!data) return false;
    if (data.isAdmin) return true;
    return data.permissions.includes(permission);
  };

  return {
    ...data,
    isLoading,
    hasPermission
  };
}