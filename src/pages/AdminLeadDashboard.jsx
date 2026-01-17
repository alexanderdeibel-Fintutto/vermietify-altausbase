import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfDashboard, VfKpiCard } from '@/components/dashboards/VfDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Target, TrendingUp, Calculator } from 'lucide-react';
import { VfProgress } from '@/components/shared/VfProgress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminLeadDashboard() {
  const { data: report } = useQuery({
    queryKey: ['lead-report'],
    queryFn: () => base44.functions.invoke('generateLeadReport').then(r => r.data)
  });

  if (!report) return <div>Laden...</div>;

  const sourceChartData = Object.entries(report.source_distribution).map(([name, value]) => ({
    name,
    leads: value
  }));

  return (
    <VfDashboard
      greeting="Lead Dashboard 🎯"
      date="Lead Generation & Conversion Analytics"
      kpis={[
        {
          label: 'Total Leads',
          value: report.summary.total_leads,
          icon: Users,
          highlighted: true
        },
        {
          label: 'Hot Leads',
          value: report.summary.hot_leads_count,
          trendValue: `${((report.summary.hot_leads_count / report.summary.total_leads) * 100).toFixed(1)}%`,
          icon: Target
        },
        {
          label: 'Conversion Rate',
          value: `${report.summary.conversion_rate}%`,
          trend: 'up',
          icon: TrendingUp
        },
        {
          label: 'Berechnungen',
          value: report.total_calculations,
          icon: Calculator
        }
      ]}
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Leads nach Quelle</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sourceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="leads" fill="#1E3A8A" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Top 10 Hot Leads</h3>
            <div className="space-y-3">
              {report.top_leads.map((lead) => (
                <div key={lead.email} className="flex items-center justify-between p-3 bg-[var(--theme-surface)] rounded-lg">
                  <div>
                    <div className="font-medium">{lead.name || lead.email}</div>
                    <div className="text-sm text-[var(--theme-text-muted)]">{lead.source}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[var(--vf-primary-600)]">{lead.score}</div>
                    <div className="text-xs text-[var(--theme-text-muted)]">{lead.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Conversion Funnel</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Neue Leads</span>
                  <span className="font-semibold">{report.summary.new_leads}</span>
                </div>
                <VfProgress value={report.summary.new_leads} max={report.summary.total_leads} variant="gradient" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Qualifiziert</span>
                  <span className="font-semibold">{report.summary.qualified_leads}</span>
                </div>
                <VfProgress value={report.summary.qualified_leads} max={report.summary.total_leads} variant="gradient" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Konvertiert</span>
                  <span className="font-semibold">{report.summary.converted_leads}</span>
                </div>
                <VfProgress value={report.summary.converted_leads} max={report.summary.total_leads} variant="success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </VfDashboard>
  );
}