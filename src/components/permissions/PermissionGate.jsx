import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function PermissionGate({
  resource,
  action,
  companyId,
  children,
  fallback
}) {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: permission, isLoading } = useQuery({
    queryKey: ['user-permission', resource, action, companyId],
    queryFn: () =>
      base44.functions.invoke('checkUserPermission', {
        resource: resource,
        action: action,
        company_id: companyId
      }),
    enabled: !!user && !!companyId
  });

  if (isLoading) {
    return null;
  }

  const hasPermission = permission?.data?.has_permission;

  if (!hasPermission) {
    if (fallback) {
      return fallback;
    }

    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Keine Berechtigung</p>
              <p className="text-sm text-amber-800 mt-1">
                Sie haben nicht die erforderlichen Berechtigungen für diese Aktion.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return children;
}