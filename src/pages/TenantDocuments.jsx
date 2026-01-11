import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TenantDocumentAccess from '@/components/tenant-app/TenantDocumentAccess';

export default function TenantDocuments() {
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

  if (!tenant) return <div className="text-center py-12">Lade...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Meine Dokumente</h1>
      <TenantDocumentAccess tenantId={tenant.id} />
    </div>
  );
}