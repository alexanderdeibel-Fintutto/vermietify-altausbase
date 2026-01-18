import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, FileText, AlertCircle } from 'lucide-react';

export default function StBDashboard() {
  const { data: mandanten = [] } = useQuery({
    queryKey: ['mandanten'],
    queryFn: () => base44.entities.Mandant.list()
  });

  const { data: anlagenV = [] } = useQuery({
    queryKey: ['anlagen-v'],
    queryFn: () => base44.entities.AnlageV.list()
  });

  const pending = anlagenV.filter(a => a.status === 'DRAFT' || a.status === 'CALCULATED').length;
  const completed = anlagenV.filter(a => a.status === 'SUBMITTED').length;

  return (
    <div className="p-6 max-w-7xl mx-auto theme-b2b">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Steuerberater-Dashboard</h1>
        <p className="text-[var(--theme-text-secondary)]">
          Übersicht Ihrer Mandate
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-[var(--theme-primary)]" />
              <div>
                <div className="text-3xl font-bold">{mandanten.length}</div>
                <div className="text-sm text-[var(--theme-text-muted)]">Mandate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-[var(--vf-warning-500)]" />
              <div>
                <div className="text-3xl font-bold">{pending}</div>
                <div className="text-sm text-[var(--theme-text-muted)]">Offen</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-[var(--vf-success-500)]" />
              <div>
                <div className="text-3xl font-bold">{completed}</div>
                <div className="text-sm text-[var(--theme-text-muted)]">Abgeschlossen</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mandanten-Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="vf-table-container">
            <table className="vf-table">
              <thead>
                <tr>
                  <th>Mandant</th>
                  <th>Objekte</th>
                  <th>Anlagen V</th>
                  <th>Status</th>
                  <th>Frist</th>
                </tr>
              </thead>
              <tbody>
                {mandanten.map((m) => (
                  <tr key={m.id}>
                    <td className="font-medium">{m.name}</td>
                    <td>-</td>
                    <td>-</td>
                    <td><span className="vf-badge vf-badge-warning">Offen</span></td>
                    <td className="text-[var(--theme-text-muted)]">31.07.2026</td>
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