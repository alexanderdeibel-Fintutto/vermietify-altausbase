import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function RoleBasedGuard({ children, requiredRole = 'user', fallback = null }) {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const roleHierarchy = { admin: 3, user: 2, viewer: 1 };
  const userLevel = roleHierarchy[user?.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  if (userLevel < requiredLevel) {
    return fallback || (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="w-4 h-4 text-red-600" />
        <AlertDescription className="text-red-800">
          ⛔ Sie haben keine Berechtigung für diese Funktion ({requiredRole} erforderlich)
        </AlertDescription>
      </Alert>
    );
  }

  return children;
}