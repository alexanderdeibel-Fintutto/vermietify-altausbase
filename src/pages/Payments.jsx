import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import PaymentFilterBar from '@/components/payments/PaymentFilterBar';
import PaymentTable from '@/components/payments/PaymentTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Payments() {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    period: 'all'
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.ActualPayment.list('-due_date')
  });

  const filtered = payments.filter(payment => {
    if (filters.status !== 'all' && payment.status !== filters.status) return false;
    if (filters.search && !payment.tenant_name?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Zahlungen"
        subtitle={`${filtered.length} Zahlungen`}
        actions={
          <Button variant="gradient">
            <Plus className="h-4 w-4 mr-2" />
            Zahlung erfassen
          </Button>
        }
      />

      <PaymentFilterBar filters={filters} onChange={setFilters} />

      <div className="mt-6">
        <PaymentTable payments={filtered} />
      </div>
    </div>
  );
}