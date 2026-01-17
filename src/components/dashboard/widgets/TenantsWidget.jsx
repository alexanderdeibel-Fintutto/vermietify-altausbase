import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TenantsWidget() {
  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list('-created_date', 5)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Mieter
          <span className="vf-badge vf-badge-primary">{tenants.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tenants.map((tenant) => (
            <Link key={tenant.id} to={createPageUrl('TenantDetail') + `?id=${tenant.id}`}>
              <div className="p-3 bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)] rounded-lg transition-colors">
                <div className="font-medium text-sm">{tenant.name}</div>
                {tenant.email && (
                  <div className="text-xs text-[var(--theme-text-muted)] mt-1">{tenant.email}</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Link to={createPageUrl('Tenants')} className="w-full">
          <Button variant="outline" className="w-full">
            Alle ansehen
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}