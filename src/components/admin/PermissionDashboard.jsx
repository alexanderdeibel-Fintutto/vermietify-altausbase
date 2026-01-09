import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function PermissionDashboard() {
  const { data: permissions, isLoading } = useQuery({
    queryKey: ['permissionOverview'],
    queryFn: async () => {
      const perms = await base44.entities.UserPermission.list('-created_date', 100);
      const roles = await base44.entities.UserRole.list('-created_at', 100);

      const categorized = {};
      for (const perm of perms) {
        if (!categorized[perm.category]) {
          categorized[perm.category] = [];
        }
        categorized[perm.category].push(perm);
      }

      return { permissions: categorized, roles };
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Berechtigungsübersicht</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(permissions?.permissions || {}).map(([category, perms]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {perms.map(perm => (
                  <div key={perm.id} className="p-2 bg-slate-50 rounded border border-slate-200">
                    <p className="text-sm font-semibold">{perm.permission_name}</p>
                    <p className="text-xs text-slate-600">{perm.description}</p>
                    <p className="text-xs text-slate-500 mt-1">Code: {perm.permission_code}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rollenstatistiken</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-red-50 rounded border border-red-200">
              <p className="text-xs text-red-700 font-semibold">Admin</p>
              <p className="text-2xl font-bold text-red-900">
                {permissions?.roles?.filter(r => r.permission_profile === 'admin').length || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-700 font-semibold">Manager</p>
              <p className="text-2xl font-bold text-blue-900">
                {permissions?.roles?.filter(r => r.permission_profile === 'manager').length || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded border border-purple-200">
              <p className="text-xs text-purple-700 font-semibold">Analyst</p>
              <p className="text-2xl font-bold text-purple-900">
                {permissions?.roles?.filter(r => r.permission_profile === 'analyst').length || 0}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs text-gray-700 font-semibold">Benutzerdefiniert</p>
              <p className="text-2xl font-bold text-gray-900">
                {permissions?.roles?.filter(r => r.role_type === 'custom').length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}