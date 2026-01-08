import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, FileText, Clock, CheckCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdvancedReportingDashboard({ submissions }) {
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  // Year-over-Year comparison
  const thisYearSubmissions = submissions.filter(s => s.tax_year === currentYear);
  const lastYearSubmissions = submissions.filter(s => s.tax_year === lastYear);
  const yoyGrowth = lastYearSubmissions.length > 0 
    ? ((thisYearSubmissions.length - lastYearSubmissions.length) / lastYearSubmissions.length) * 100 
    : 0;

  // Status distribution
  const statusData = [
    { name: 'Akzeptiert', value: submissions.filter(s => s.status === 'ACCEPTED').length, color: '#10b981' },
    { name: 'Eingereicht', value: submissions.filter(s => s.status === 'SUBMITTED').length, color: '#3b82f6' },
    { name: 'Validiert', value: submissions.filter(s => s.status === 'VALIDATED').length, color: '#8b5cf6' },
    { name: 'Entwurf', value: submissions.filter(s => s.status === 'DRAFT').length, color: '#f59e0b' }
  ];

  // Monthly trend
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (5 - i));
    const monthStr = month.toLocaleDateString('de-DE', { month: 'short' });
    const count = submissions.filter(s => {
      const subDate = new Date(s.created_date);
      return subDate.getMonth() === month.getMonth() && subDate.getFullYear() === month.getFullYear();
    }).length;
    return { month: monthStr, count };
  });

  // AI Confidence trend
  const confidenceData = submissions.slice(-10).map((s, i) => ({
    name: `#${i + 1}`,
    confidence: s.ai_confidence_score || 0
  }));

  const stats = [
    {
      label: 'Gesamt Einreichungen',
      value: submissions.length,
      change: yoyGrowth,
      icon: FileText,
      color: 'blue'
    },
    {
      label: 'Akzeptanzrate',
      value: `${submissions.length > 0 ? ((submissions.filter(s => s.status === 'ACCEPTED').length / submissions.length) * 100).toFixed(0) : 0}%`,
      change: 5.2,
      icon: CheckCircle,
      color: 'green'
    },
    {
      label: 'Ø Verarbeitungszeit',
      value: '2.3 Tage',
      change: -12.5,
      icon: Clock,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const isPositive = stat.change > 0;
          return (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-${stat.color}-50`}>
                    <Icon className={`w-5 h-5 text-${stat.color}-600`} />
                  </div>
                  <Badge variant={isPositive ? 'default' : 'secondary'} className="text-xs">
                    {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {Math.abs(stat.change).toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monatlicher Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status-Verteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Confidence Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">KI-Konfidenz Entwicklung</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={confidenceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="confidence" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}