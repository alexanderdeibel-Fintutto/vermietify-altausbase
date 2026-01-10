import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TenantsWidget() {
  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-widget'],
    queryFn: () => base44.entities.Tenant.list('-updated_date', 10)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          Mieter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tenants.slice(0, 5).map(tenant => (
            <Link key={tenant.id} to={createPageUrl('TenantDetail') + `?id=${tenant.id}`}>
              <div className="p-2 border rounded hover:bg-slate-50">
                <p className="text-sm font-semibold">{tenant.first_name} {tenant.last_name}</p>
                <p className="text-xs text-slate-600">{tenant.email}</p>
              </div>
            </Link>
          ))}
          {tenants.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">Keine Mieter</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}