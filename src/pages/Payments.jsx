import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import PaymentTable from '@/components/payments/PaymentTable';
import PaymentFilterBar from '@/components/payments/PaymentFilterBar';
import PaymentReminderDialog from '@/components/payments/PaymentReminderDialog';

export default function Payments() {
  const [filters, setFilters] = useState({});
  const [reminderOpen, setReminderOpen] = useState(false);

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => base44.entities.ActualPayment.list('-datum')
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Zahlungen"
        subtitle={`${payments.length} Zahlungen`}
      />

      <PaymentFilterBar filters={filters} onChange={setFilters} />

      <div className="mt-6">
        <PaymentTable payments={payments} />
      </div>

      <PaymentReminderDialog open={reminderOpen} onClose={() => setReminderOpen(false)} />
    </div>
  );
}