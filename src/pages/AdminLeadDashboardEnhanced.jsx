import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, TrendingUp, Mail, CheckCircle } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';

export default function AdminLeadDashboardEnhanced() {
  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date')
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Lead-Management"
        subtitle="Übersicht aller Leads und Conversions"
      />

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-[var(--theme-primary)]" />
              <div>
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-sm text-[var(--theme-text-muted)]">Gesamt</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-[var(--vf-info-500)]" />
              <div>
                <div className="text-3xl font-bold">{stats.new}</div>
                <div className="text-sm text-[var(--theme-text-muted)]">Neu</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-[var(--vf-warning-500)]" />
              <div>
                <div className="text-3xl font-bold">{stats.qualified}</div>
                <div className="text-sm text-[var(--theme-text-muted)]">Qualifiziert</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-[var(--vf-success-500)]" />
              <div>
                <div className="text-3xl font-bold">{stats.converted}</div>
                <div className="text-sm text-[var(--theme-text-muted)]">Konvertiert</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="vf-table-container">
            <table className="vf-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>E-Mail</th>
                  <th>Quelle</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="font-medium">{lead.name || '-'}</td>
                    <td>{lead.email}</td>
                    <td>
                      <span className="vf-badge vf-badge-default">{lead.source}</span>
                    </td>
                    <td>
                      <span className={`font-bold ${
                        lead.score >= 70 ? 'text-[var(--vf-success-600)]' :
                        lead.score >= 40 ? 'text-[var(--vf-warning-600)]' :
                        'text-[var(--vf-error-600)]'
                      }`}>
                        {lead.score}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="text-[var(--theme-text-muted)]">
                      {new Date(lead.created_date).toLocaleDateString('de-DE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}