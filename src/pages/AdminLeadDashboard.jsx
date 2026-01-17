import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfDashboard, VfKpiCard, VfDashboardWidget } from '@/components/dashboards/VfDashboard';
import { Users, TrendingUp, Target, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminLeadDashboard() {
  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list()
  });

  const { data: quizResults = [] } = useQuery({
    queryKey: ['quiz-results'],
    queryFn: () => base44.entities.QuizResult.list()
  });

  const { data: calculations = [] } = useQuery({
    queryKey: ['calculations'],
    queryFn: () => base44.entities.CalculationHistory.list()
  });

  const newLeadsThisMonth = leads.filter(l => {
    const created = new Date(l.created_date);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const conversionRate = leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0;

  const sourceData = leads.reduce((acc, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(sourceData).map(([source, count]) => ({
    name: source,
    count
  }));

  return (
    <VfDashboard
      greeting="Lead Dashboard 🎯"
      date="Performance-Übersicht"
      kpis={[
        {
          label: 'Gesamt Leads',
          value: leads.length,
          trend: 'up',
          trendValue: `+${newLeadsThisMonth} diesen Monat`,
          icon: Users,
          highlighted: true
        },
        {
          label: 'Conversion Rate',
          value: `${conversionRate.toFixed(1)}%`,
          trend: conversionRate >= 10 ? 'up' : 'warning',
          trendValue: `${convertedLeads} konvertiert`,
          icon: Target
        },
        {
          label: 'Quiz-Teilnahmen',
          value: quizResults.length,
          icon: Award
        },
        {
          label: 'Berechnungen',
          value: calculations.length,
          icon: TrendingUp
        }
      ]}
    >
      <div className="vf-dashboard__grid">
        <VfDashboardWidget title="Leads nach Quelle">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="var(--vf-primary-600)" />
            </BarChart>
          </ResponsiveContainer>
        </VfDashboardWidget>

        <VfDashboardWidget
          title="Top Leads"
          footer={
            <button className="text-sm text-[var(--theme-primary)] hover:underline">
              Alle Leads →
            </button>
          }
        >
          {leads
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((lead) => (
              <div key={lead.id} className="flex justify-between items-center py-2 border-b border-[var(--theme-divider)] last:border-0">
                <div>
                  <div className="font-medium">{lead.name || lead.email}</div>
                  <div className="text-sm text-[var(--theme-text-muted)]">{lead.source}</div>
                </div>
                <div className="font-semibold text-[var(--vf-primary-600)]">
                  {lead.score}
                </div>
              </div>
            ))}
        </VfDashboardWidget>
      </div>
    </VfDashboard>
  );
}