import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TenantMaintenanceRequest from '@/components/tenant-app/TenantMaintenanceRequest';

export default function TenantMaintenance() {
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
      const contracts = await base44.entities.LeaseContract.filter({ tenant_id: tenant.id, status: 'active' });
      return contracts[0];
    },
    enabled: !!tenant?.id
  });

  if (!tenant || !contract) return <div className="text-center py-12">Lade...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Wartung & Reparaturen</h1>
      <TenantMaintenanceRequest tenantId={tenant.id} unitId={contract.unit_id} companyId={tenant.company_id} />
    </div>
  );
}