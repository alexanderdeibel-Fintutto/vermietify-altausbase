import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShieldAlert, Lock } from 'lucide-react';

export default function RoleBasedGuard({ 
  children, 
  requiredRole = 'admin',
  fallbackMessage = 'Sie haben keine Berechtigung, diese Funktion zu nutzen.'
}) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  if (isLoading) {
    return <div className="p-4 text-center text-slate-600">Lade...</div>;
  }

  if (!user) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-8 text-center">
          <Lock className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Nicht authentifiziert</h3>
          <p className="text-slate-700">Bitte melden Sie sich an.</p>
        </CardContent>
      </Card>
    );
  }

  // Check role
  const hasAccess = requiredRole === 'admin' ? user.role === 'admin' : true;

  if (!hasAccess) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-orange-900 mb-2">Zugriff verweigert</h3>
          <p className="text-slate-700">{fallbackMessage}</p>
          <p className="text-sm text-slate-600 mt-2">Ihre Rolle: {user.role}</p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}