import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useAdminAccess() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = user?.role === 'admin';

  const hasPermission = (requiredRole = 'admin') => {
    if (!user) return false;
    if (requiredRole === 'admin') return user.role === 'admin';
    return true; // All authenticated users have basic access
  };

  return {
    user,
    isAdmin,
    hasPermission,
    isLoading
  };
}