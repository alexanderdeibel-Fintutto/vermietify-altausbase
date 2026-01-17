import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfListPage, VfListPageHeader } from '@/components/list-pages/VfListPage';
import { VfDataTable } from '@/components/list-pages/VfDataTable';
import { VfFilterBar } from '@/components/list-pages/VfFilterBar';
import { VfBadge } from '@/components/shared/VfBadge';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, RefreshCw } from 'lucide-react';

export default function AdminSubscriptions() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: 'all', plan: 'all' });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.UserSubscription.list('-created_date')
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.SubscriptionPlan.list()
  });

  const filteredSubs = subscriptions.filter(sub => {
    if (filters.status !== 'all' && sub.status !== filters.status) return false;
    if (filters.plan !== 'all' && sub.plan_id !== filters.plan) return false;
    return true;
  });

  const columns = [
    { key: 'user_email', label: 'Benutzer', sortable: true },
    { 
      key: 'plan_id', 
      label: 'Plan',
      render: (row) => {
        const plan = plans.find(p => p.id === row.plan_id);
        return plan?.name || row.plan_id;
      }
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (row) => (
        <VfBadge variant={
          row.status === 'ACTIVE' ? 'success' :
          row.status === 'TRIAL' ? 'warning' :
          row.status === 'CANCELLED' ? 'error' : 'default'
        }>
          {row.status}
        </VfBadge>
      )
    },
    { 
      key: 'billing_cycle', 
      label: 'Zyklus',
      render: (row) => row.billing_cycle === 'MONTHLY' ? 'Monatlich' : 'Jährlich'
    },
    { 
      key: 'start_date', 
      label: 'Start',
      render: (row) => new Date(row.start_date).toLocaleDateString('de-DE')
    },
    { 
      key: 'next_billing_date', 
      label: 'Nächste Zahlung',
      render: (row) => new Date(row.next_billing_date).toLocaleDateString('de-DE')
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" title="Details">
            <CreditCard className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <VfListPage>
      <VfListPageHeader
        title="Abonnements"
        description={`${subscriptions.length} Abonnements • ${subscriptions.filter(s => s.status === 'ACTIVE').length} aktiv`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="primary" onClick={() => queryClient.invalidateQueries(['subscriptions'])}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
        }
      />

      <VfFilterBar
        filters={[
          {
            type: 'select',
            label: 'Status',
            value: filters.status,
            onChange: (v) => setFilters({ ...filters, status: v }),
            options: [
              { value: 'all', label: 'Alle' },
              { value: 'TRIAL', label: 'Trial' },
              { value: 'ACTIVE', label: 'Aktiv' },
              { value: 'PAUSED', label: 'Pausiert' },
              { value: 'CANCELLED', label: 'Gekündigt' },
              { value: 'EXPIRED', label: 'Abgelaufen' }
            ]
          },
          {
            type: 'select',
            label: 'Plan',
            value: filters.plan,
            onChange: (v) => setFilters({ ...filters, plan: v }),
            options: [
              { value: 'all', label: 'Alle Pläne' },
              ...plans.map(p => ({ value: p.id, label: p.name }))
            ]
          }
        ]}
      />

      <VfDataTable columns={columns} data={filteredSubs} />
    </VfListPage>
  );
}