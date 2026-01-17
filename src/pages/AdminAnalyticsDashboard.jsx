import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfDashboard, VfKpiCard, VfDashboardWidget } from '@/components/dashboards/VfDashboard';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp, Calculator, Target } from 'lucide-react';

export default function AdminAnalyticsDashboard() {
  const { data: analysis } = useQuery({
    queryKey: ['lead-analysis'],
    queryFn: () => base44.functions.invoke('analyzeLeadBehavior').then(r => r.data),
    refetchInterval: 60000
  });

  if (!analysis) {
    return <div>Laden...</div>;
  }

  const sourceData = Object.entries(analysis.by_source).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#1E3A8A', '#F97316', '#10B981', '#F59E0B', '#6366F1'];

  return (
    <VfDashboard
      greeting="Analytics Dashboard 📊"
      date="Lead & Conversion Analytics"
      kpis={[
        {
          label: 'Total Leads',
          value: analysis.total_leads,
          icon: Users,
          highlighted: true
        },
        {
          label: 'Ø Score',
          value: Math.round(analysis.avg_score),
          trendValue: '/100',
          icon: Target
        },
        {
          label: 'Calculator-Nutzung',
          value: analysis.engagement.used_calculator,
          trendValue: `${Math.round((analysis.engagement.used_calculator / analysis.total_leads) * 100)}%`,
          icon: Calculator
        },
        {
          label: 'Conversion Rate',
          value: `${Math.round((analysis.conversion_funnel.converted / analysis.total_leads) * 100)}%`,
          trend: 'up',
          icon: TrendingUp
        }
      ]}
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <VfDashboardWidget title="Leads nach Quelle">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {sourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </VfDashboardWidget>

        <VfDashboardWidget title="Conversion Funnel">
          <div className="space-y-3">
            {Object.entries(analysis.conversion_funnel).map(([stage, count]) => {
              const percentage = analysis.total_leads > 0 ? (count / analysis.total_leads) * 100 : 0;
              return (
                <div key={stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{stage.replace('_', ' ')}</span>
                    <span className="font-semibold">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="vf-progress">
                    <div 
                      className="vf-progress-bar vf-progress-bar-gradient" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </VfDashboardWidget>

        <VfDashboardWidget title="Top Performing Sources" className="lg:col-span-2">
          <table className="vf-table w-full">
            <thead>
              <tr>
                <th>Quelle</th>
                <th>Total Leads</th>
                <th>Konvertiert</th>
                <th>Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {analysis.top_performing_sources.slice(0, 5).map((source) => (
                <tr key={source.source}>
                  <td className="font-medium">{source.source}</td>
                  <td>{source.total}</td>
                  <td>{source.converted}</td>
                  <td>
                    <span className={source.conversion_rate >= 10 ? 'text-[var(--vf-success-600)]' : ''}>
                      {source.conversion_rate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </VfDashboardWidget>
      </div>
    </VfDashboard>
  );
}