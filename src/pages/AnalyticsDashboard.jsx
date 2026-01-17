import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import StatGrid from '@/components/stats/StatGrid';
import TrendAnalysisChart from '@/components/analytics/TrendAnalysisChart';
import DateRangeSelector from '@/components/shared/DateRangeSelector';
import { Users, Building2, FileText, Euro } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const stats = [
    {
      label: 'Objekte',
      value: buildings.length,
      icon: Building2,
      trend: { value: 12, positive: true }
    },
    {
      label: 'Mieter',
      value: tenants.length,
      icon: Users,
      trend: { value: 8, positive: true }
    },
    {
      label: 'Aktive Verträge',
      value: contracts.filter(c => c.status === 'active').length,
      icon: FileText,
      trend: { value: 5, positive: true }
    },
    {
      label: 'Mieteinnahmen',
      value: `€${contracts.reduce((sum, c) => sum + (c.rent_cold || 0), 0).toLocaleString()}`,
      icon: Euro,
      variant: 'highlighted'
    }
  ];

  const trendData = [
    { name: 'Jan', value: 45 },
    { name: 'Feb', value: 52 },
    { name: 'Mär', value: 48 },
    { name: 'Apr', value: 61 },
    { name: 'Mai', value: 58 },
    { name: 'Jun', value: 67 }
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Übersicht Ihrer Kennzahlen"
      />

      <div className="mb-6">
        <DateRangeSelector
          startDate={dateRange.start}
          endDate={dateRange.end}
          onStartChange={(d) => setDateRange({ ...dateRange, start: d })}
          onEndChange={(d) => setDateRange({ ...dateRange, end: d })}
        />
      </div>

      <StatGrid stats={stats} columns={4} className="mb-6" />

      <TrendAnalysisChart data={trendData} title="Entwicklung" />
    </div>
  );
}