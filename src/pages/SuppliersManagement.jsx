import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import SupplierTable from '@/components/suppliers/SupplierTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function SuppliersManagement() {
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list()
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Lieferanten"
        subtitle={`${suppliers.length} Lieferanten`}
        actions={
          <Button variant="gradient">
            <Plus className="h-4 w-4 mr-2" />
            Neuer Lieferant
          </Button>
        }
      />

      <div className="mt-6">
        <SupplierTable suppliers={suppliers} onView={(s) => console.log(s)} />
      </div>
    </div>
  );
}