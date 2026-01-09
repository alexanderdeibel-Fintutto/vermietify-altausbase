import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReportFilterBar from '@/components/reports/ReportFilterBar';
import ReportTable from '@/components/reports/ReportTable';
import QuickStats from '@/components/shared/QuickStats';

export default function ReportsPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.ReportSchedule?.list?.() || []
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ReportSchedule.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] })
  });

  const filteredReports = reports.filter(r => (r.name || '').toLowerCase().includes(search.toLowerCase()));

  const stats = [
    { label: 'Gesamt-Reports', value: reports.length },
    { label: 'Diese Woche', value: 0 },
    { label: 'Geplante Reports', value: reports.filter(r => r.is_active).length },
    { label: 'Downloads', value: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extralight text-slate-700 tracking-wide">Reports</h1>
        <p className="text-sm font-extralight text-slate-400 mt-1">Erstellen und verwalten Sie automatisierte Reports</p>
      </div>
      <QuickStats stats={stats} accentColor="rose" />
      <ReportFilterBar onSearchChange={setSearch} onGenerateReport={() => {}} />
      <ReportTable reports={filteredReports} onView={() => {}} onDownload={() => {}} onDelete={(r) => deleteMutation.mutate(r.id)} />
    </div>
  );
}