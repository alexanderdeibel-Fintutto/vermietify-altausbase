import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminBoardManager from '@/components/building-board/AdminBoardManager';
import TenantBuildingBoard from '@/components/building-board/TenantBuildingBoard';

export default function BuildingBoardPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Check if user is admin
  if (user?.role === 'admin') {
    return <AdminBoardManager />;
  }

  // For tenants, find their tenant record
  const { data: tenant } = useQuery({
    queryKey: ['currentTenant', user?.email],
    queryFn: async () => {
      const tenants = await base44.entities.Tenant.filter({ email: user.email }, null, 1);
      return tenants[0];
    },
    enabled: !!user?.email && user?.role !== 'admin'
  });

  if (!tenant) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-600">Kein Mieterprofil gefunden</p>
      </div>
    );
  }

  return <TenantBuildingBoard tenantId={tenant.id} />;
}