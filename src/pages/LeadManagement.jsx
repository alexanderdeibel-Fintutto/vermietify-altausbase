import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfListPage } from '@/components/list-pages/VfListPage';
import { VfListPageHeader } from '@/components/list-pages/VfListPage';
import { VfFilterBar } from '@/components/list-pages/VfFilterBar';
import { VfDataTable } from '@/components/list-pages/VfDataTable';
import { VfPagination } from '@/components/list-pages/VfPagination';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Mail, Phone, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LeadManagement() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: 'all',
    source: 'all',
    search: ''
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-score')
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Lead.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  const filteredLeads = leads.filter(lead => {
    if (filters.status !== 'all' && lead.status !== filters.status) return false;
    if (filters.source !== 'all' && lead.source !== filters.source) return false;
    if (filters.search && !lead.email.toLowerCase().includes(filters.search.toLowerCase()) && 
        (!lead.name || !lead.name.toLowerCase().includes(filters.search.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="p-6">
      <VfListPageHeader
        title="Lead Management"
        description={`${leads.length} Leads gesamt • ${leads.filter(l => l.status === 'new').length} neu`}
        actions={
          <Button variant="gradient">
            <UserPlus className="h-4 w-4 mr-2" />
            Lead manuell hinzufügen
          </Button>
        }
      />

      <VfFilterBar
        searchPlaceholder="Nach E-Mail oder Name suchen..."
        searchValue={filters.search}
        onSearchChange={(v) => setFilters({ ...filters, search: v })}
        filters={
          <>
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="new">Neu</SelectItem>
                <SelectItem value="contacted">Kontaktiert</SelectItem>
                <SelectItem value="qualified">Qualifiziert</SelectItem>
                <SelectItem value="converted">Konvertiert</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.source} onValueChange={(v) => setFilters({ ...filters, source: v })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Quellen</SelectItem>
                <SelectItem value="rendite_rechner">Rendite-Rechner</SelectItem>
                <SelectItem value="immobilien_quiz">Quiz</SelectItem>
                <SelectItem value="website">Website</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <div className="vf-data-table-container">
        <table className="vf-data-table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Score</th>
              <th>Quelle</th>
              <th>Status</th>
              <th>Erstellt</th>
              <th className="vf-table-cell-actions">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <div>
                    <div className="font-medium">{lead.name || lead.email}</div>
                    {lead.name && (
                      <div className="text-sm text-[var(--theme-text-muted)]">{lead.email}</div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Star className={cn(
                      "h-4 w-4",
                      lead.score >= 70 ? "text-[var(--vf-success-500)]" :
                      lead.score >= 40 ? "text-[var(--vf-warning-500)]" :
                      "text-[var(--vf-neutral-400)]"
                    )} />
                    <span className="font-semibold">{lead.score}</span>
                  </div>
                </td>
                <td>
                  <span className="vf-badge vf-badge-default">
                    {lead.source}
                  </span>
                </td>
                <td>
                  <Select 
                    value={lead.status} 
                    onValueChange={(v) => updateStatusMutation.mutate({ id: lead.id, status: v })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Neu</SelectItem>
                      <SelectItem value="contacted">Kontaktiert</SelectItem>
                      <SelectItem value="qualified">Qualifiziert</SelectItem>
                      <SelectItem value="converted">Konvertiert</SelectItem>
                      <SelectItem value="lost">Verloren</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="vf-table-cell-date">
                  {new Date(lead.created_date).toLocaleDateString('de-DE')}
                </td>
                <td className="vf-table-cell-actions">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" title="E-Mail senden">
                      <Mail className="h-4 w-4" />
                    </Button>
                    {lead.phone && (
                      <Button variant="ghost" size="sm" title="Anrufen">
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}