import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AnalyticsFilterBar from '@/components/analytics/AnalyticsFilterBar';
import QuickStats from '@/components/shared/QuickStats';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('month');
  const [metric, setMetric] = useState('revenue');

  const revenueData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mär', value: 2000 },
    { name: 'Apr', value: 2780 },
    { name: 'Mai', value: 1890 },
    { name: 'Jun', value: 2390 },
  ];

  const occupancyData = [
    { name: 'Vollständig', value: 65 },
    { name: 'Teilweise', value: 25 },
    { name: 'Leer', value: 10 },
  ];

  const COLORS = ['#8b5cf6', '#10b981', '#ef4444'];

  const stats = [
    { label: 'Monatliche Einnahmen', value: '€12,450' },
    { label: 'Belegungsquote', value: '90%' },
    { label: 'Durchschn. Miete', value: '€850' },
    { label: 'YoY-Wachstum', value: '12.5%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">📊 Analytics</h1>
        <p className="text-slate-600 mt-1">Überwachen Sie Ihre Portfolioleistung in Echtzeit</p>
      </div>

      <QuickStats stats={stats} accentColor="cyan" />

      <AnalyticsFilterBar onDateRangeChange={setDateRange} onMetricChange={setMetric} />

      <div className="grid grid-cols-2 gap-6">
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Einnahmeverlauf</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Belegungsverteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={occupancyData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}%`} outerRadius={80} fill="#8b5cf6" dataKey="value">
                  {occupancyData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Gebäude-Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}