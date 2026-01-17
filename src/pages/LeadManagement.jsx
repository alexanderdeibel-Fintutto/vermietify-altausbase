import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfListPage, VfListPageHeader } from '@/components/list-pages/VfListPage';
import { VfDataTable } from '@/components/list-pages/VfDataTable';
import { VfFilterBar } from '@/components/list-pages/VfFilterBar';
import { Button } from '@/components/ui/button';
import { VfBadge } from '@/components/shared/VfBadge';
import { Mail, Phone, UserPlus, TrendingUp } from 'lucide-react';

export default function LeadManagement() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: 'all', interest: 'all' });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-score')
  });

  const convertMutation = useMutation({
    mutationFn: (leadId) => base44.functions.invoke('convertLeadToUser', { lead_id: leadId }),
    onSuccess: () => queryClient.invalidateQueries(['leads'])
  });

  const filteredLeads = leads.filter(lead => {
    if (filters.status !== 'all' && lead.status !== filters.status) return false;
    if (filters.interest !== 'all' && lead.interest_level !== filters.interest) return false;
    return true;
  });

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'E-Mail', sortable: true },
    { 
      key: 'score', 
      label: 'Score', 
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-20 vf-progress vf-progress-sm">
            <div className="vf-progress-bar vf-progress-bar-gradient" style={{ width: `${row.score}%` }} />
          </div>
          <span className="font-semibold">{row.score}</span>
        </div>
      )
    },
    { 
      key: 'interest_level', 
      label: 'Interest',
      render: (row) => (
        <VfBadge variant={
          row.interest_level === 'hot' ? 'error' :
          row.interest_level === 'warm' ? 'warning' : 'default'
        }>
          {row.interest_level}
        </VfBadge>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (row) => (
        <VfBadge variant={
          row.status === 'converted' ? 'success' :
          row.status === 'qualified' ? 'info' : 'default'
        }>
          {row.status}
        </VfBadge>
      )
    },
    { 
      key: 'source', 
      label: 'Quelle',
      render: (row) => <span className="text-sm">{row.source}</span>
    },
    {
      key: 'actions',
      label: 'Aktionen',
      render: (row) => (
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.open(`mailto:${row.email}`)}
          >
            <Mail className="h-4 w-4" />
          </Button>
          {row.phone && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.open(`tel:${row.phone}`)}
            >
              <Phone className="h-4 w-4" />
            </Button>
          )}
          {row.status !== 'converted' && (
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => convertMutation.mutate(row.id)}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Convert
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <VfListPage>
      <VfListPageHeader
        title="Lead Management"
        description={`${leads.length} Leads • ${leads.filter(l => l.interest_level === 'hot').length} Hot Leads`}
        actions={
          <Button variant="gradient">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </Button>
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
              { value: 'new', label: 'Neu' },
              { value: 'contacted', label: 'Kontaktiert' },
              { value: 'qualified', label: 'Qualifiziert' },
              { value: 'trial_started', label: 'Trial' },
              { value: 'converted', label: 'Konvertiert' }
            ]
          },
          {
            type: 'select',
            label: 'Interest',
            value: filters.interest,
            onChange: (v) => setFilters({ ...filters, interest: v }),
            options: [
              { value: 'all', label: 'Alle' },
              { value: 'hot', label: 'Hot' },
              { value: 'warm', label: 'Warm' },
              { value: 'cold', label: 'Cold' }
            ]
          }
        ]}
      />

      <VfDataTable
        columns={columns}
        data={filteredLeads}
      />
    </VfListPage>
  );
}