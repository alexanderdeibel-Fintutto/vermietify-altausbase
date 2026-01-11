import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import CommunityFeed from '@/components/tenant-community/CommunityFeed';

export default function TenantCommunity() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant-data', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const tenants = await base44.entities.Tenant.filter({ email: user.email });
      return tenants[0];
    },
    enabled: !!user?.email
  });

  const { data: contract } = useQuery({
    queryKey: ['tenant-contract', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      const contracts = await base44.entities.LeaseContract.filter({ 
        tenant_id: tenant.id, 
        status: 'active' 
      });
      return contracts[0];
    },
    enabled: !!tenant?.id
  });

  const { data: unit } = useQuery({
    queryKey: ['tenant-unit', contract?.unit_id],
    queryFn: () => base44.entities.Unit.read(contract.unit_id),
    enabled: !!contract?.unit_id
  });

  if (!tenant || !contract || !unit) {
    return <div className="text-center py-12">Lade Community...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="w-8 h-8" />
          Nachbarschaft & Community
        </h1>
        <p className="text-slate-600 mt-1">
          Vernetzen Sie sich mit Ihren Nachbarn im Gebäude
        </p>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-4">
          <p className="text-sm text-slate-700">
            🔒 <strong>Datenschutz:</strong> Alle Beiträge sind nur für Mieter Ihres Gebäudes sichtbar. 
            Ihr voller Name wird nicht angezeigt. Kontaktieren Sie andere Mieter über die App-Nachricht-Funktion.
          </p>
        </CardContent>
      </Card>

      <CommunityFeed 
        tenantId={tenant.id} 
        buildingId={unit.building_id} 
        companyId={companyId}
      />
    </div>
  );
}