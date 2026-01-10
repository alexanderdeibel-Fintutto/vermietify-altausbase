import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DocumentAnalyticsDashboard({ companyId }) {
  const [period, setPeriod] = useState(30);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['document-analytics', companyId, period],
    queryFn: async () => {
      const result = await base44.functions.invoke('generateDocumentAnalytics', {
        company_id: companyId,
        period_days: period
      });
      return result.data.analytics;
    }
  });

  if (isLoading) return <div className="text-center py-12">Lade Analysen...</div>;

  const typeData = analytics?.by_type ? Object.entries(analytics.by_type).map(([type, count]) => ({
    name: type,
    value: count
  })) : [];

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {[7, 30, 90].map(days => (
          <Button
            key={days}
            variant={period === days ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(days)}
          >
            {days}T
          </Button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Gesamt</p>
                <p className="text-2xl font-bold">{analytics?.total_documents || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Diese Periode</p>
                <p className="text-2xl font-bold">{analytics?.documents_this_period || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Ø Bearbeitungszeit</p>
                <p className="text-2xl font-bold">{Math.round(analytics?.avg_processing_time / 60) || 0}m</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Ausstehend</p>
                <p className="text-2xl font-bold">{analytics?.pending_approvals || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Type */}
        {typeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Nach Typ</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={[
                { day: 'Mo', docs: Math.floor(analytics?.documents_this_period * 0.15) },
                { day: 'Di', docs: Math.floor(analytics?.documents_this_period * 0.18) },
                { day: 'Mi', docs: Math.floor(analytics?.documents_this_period * 0.22) },
                { day: 'Do', docs: Math.floor(analytics?.documents_this_period * 0.20) },
                { day: 'Fr', docs: Math.floor(analytics?.documents_this_period * 0.25) }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="docs" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}