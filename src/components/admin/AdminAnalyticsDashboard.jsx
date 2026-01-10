import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MessageCircle, AlertCircle, FileText, TrendingUp, Users, Clock } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminAnalyticsDashboard() {
  const { data: threads = [] } = useQuery({
    queryKey: ['analytics-threads'],
    queryFn: () => base44.entities.MessageThread.list('-created_date', 500)
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['analytics-issues'],
    queryFn: () => base44.entities.TenantIssueReport.list('-created_date', 500)
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['analytics-documents'],
    queryFn: () => base44.entities.Document.filter({ is_uploaded: true }, '-created_date', 500)
  });

  // Communication Analytics
  const threadsByCategory = Object.entries(
    threads.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const threadsByPriority = Object.entries(
    threads.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const avgResponseTime = threads
    .filter(t => t.status === 'resolved')
    .reduce((sum, t) => {
      const created = new Date(t.created_date);
      const resolved = new Date(t.last_message_at);
      return sum + (resolved - created) / (1000 * 60 * 60);
    }, 0) / Math.max(threads.filter(t => t.status === 'resolved').length, 1);

  // Issue Analytics
  const issuesByType = Object.entries(
    issues.reduce((acc, i) => {
      acc[i.issue_type] = (acc[i.issue_type] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const issuesBySeverity = Object.entries(
    issues.reduce((acc, i) => {
      acc[i.severity] = (acc[i.severity] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Document Analytics
  const documentsByCategory = Object.entries(
    documents.reduce((acc, d) => {
      const cat = d.category || 'Sonstiges';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Time-based trends (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const dailyStats = last7Days.map(date => ({
    date: new Date(date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' }),
    messages: threads.filter(t => t.created_date.startsWith(date)).length,
    issues: issues.filter(i => i.created_date.startsWith(date)).length,
    documents: documents.filter(d => d.created_date.startsWith(date)).length
  }));

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{threads.length}</p>
                <p className="text-sm text-slate-600">Unterhaltungen</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {threads.filter(t => t.status === 'open').length} offen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{issues.length}</p>
                <p className="text-sm text-slate-600">Störungsmeldungen</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {issues.filter(i => i.status !== 'resolved').length} ungelöst
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-sm text-slate-600">Dokumente</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Letzte 30 Tage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{avgResponseTime.toFixed(1)}h</p>
                <p className="text-sm text-slate-600">Ø Antwortzeit</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Durchschnittlich
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktivitätstrends (7 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="messages" stroke="#3b82f6" name="Nachrichten" strokeWidth={2} />
              <Line type="monotone" dataKey="issues" stroke="#ef4444" name="Störungen" strokeWidth={2} />
              <Line type="monotone" dataKey="documents" stroke="#8b5cf6" name="Dokumente" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Nachrichten nach Kategorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={threadsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {threadsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Störungen nach Typ</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={issuesByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dokumente nach Kategorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={documentsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {documentsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Priority & Severity Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Nachrichten nach Priorität</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={threadsByPriority} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Störungen nach Schweregrad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={issuesBySeverity} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}