import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle, Star, Clock, CheckCircle } from 'lucide-react';

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function IssueAnalytics() {
  const { data: issues = [] } = useQuery({
    queryKey: ['analytics-issues-detailed'],
    queryFn: () => base44.entities.TenantIssueReport.list('-created_date', 1000)
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ['analytics-ratings'],
    queryFn: () => base44.entities.VendorRating.list()
  });

  // Issues by type
  const issuesByType = Object.entries(
    issues.reduce((acc, i) => {
      acc[i.issue_type] = (acc[i.issue_type] || 0) + 1;
      return acc;
    }, {})
  ).map(([type, count]) => ({ type, count }));

  // Resolution time analysis
  const resolutionTimes = issues
    .filter(i => i.status === 'resolved' && i.resolved_at)
    .map(i => {
      const created = new Date(i.created_date);
      const resolved = new Date(i.resolved_at);
      const hours = (resolved - created) / (1000 * 60 * 60);
      return {
        type: i.issue_type,
        hours: hours.toFixed(1)
      };
    });

  const avgResolutionByType = Object.entries(
    resolutionTimes.reduce((acc, r) => {
      if (!acc[r.type]) acc[r.type] = { total: 0, count: 0 };
      acc[r.type].total += parseFloat(r.hours);
      acc[r.type].count += 1;
      return acc;
    }, {})
  ).map(([type, data]) => ({
    type,
    avgHours: (data.total / data.count).toFixed(1)
  }));

  // Severity distribution
  const severityDistribution = Object.entries(
    issues.reduce((acc, i) => {
      acc[i.severity] = (acc[i.severity] || 0) + 1;
      return acc;
    }, {})
  ).map(([severity, count]) => ({ severity, count }));

  // Rating statistics
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2)
    : 0;

  const ratingDistribution = [1, 2, 3, 4, 5].map(star => ({
    star: `${star} ⭐`,
    count: ratings.filter(r => r.rating === star).length
  }));

  // Issues over time (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const issuesOverTime = last30Days.map(date => ({
    date: new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    created: issues.filter(i => i.created_date.startsWith(date)).length,
    resolved: issues.filter(i => i.resolved_at && i.resolved_at.startsWith(date)).length
  }));

  const totalIssues = issues.length;
  const resolvedIssues = issues.filter(i => i.status === 'resolved').length;
  const openIssues = issues.filter(i => i.status === 'open').length;
  const resolutionRate = ((resolvedIssues / Math.max(totalIssues, 1)) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <AlertCircle className="w-6 h-6 text-red-600 mb-2" />
            <p className="text-2xl font-bold">{totalIssues}</p>
            <p className="text-sm text-slate-600">Gesamt Meldungen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
            <p className="text-2xl font-bold">{resolvedIssues}</p>
            <p className="text-sm text-slate-600">Gelöst</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Clock className="w-6 h-6 text-orange-600 mb-2" />
            <p className="text-2xl font-bold">{resolutionRate}%</p>
            <p className="text-sm text-slate-600">Lösungsrate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Star className="w-6 h-6 text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{avgRating}</p>
            <p className="text-sm text-slate-600">Ø Bewertung</p>
          </CardContent>
        </Card>
      </div>

      {/* Issues Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Störungsverlauf (30 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={issuesOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="created" stroke="#ef4444" name="Erstellt" strokeWidth={2} />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" name="Gelöst" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Issues by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Störungen nach Typ</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={issuesByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, count }) => `${type} (${count})`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {issuesByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verteilung nach Schweregrad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={severityDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="severity" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Time by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Durchschnittliche Lösungsdauer nach Typ</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={avgResolutionByType} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 12 }} label={{ value: 'Stunden', position: 'insideBottom', offset: -5 }} />
              <YAxis type="category" dataKey="type" stroke="#64748b" tick={{ fontSize: 12 }} width={120} />
              <Tooltip />
              <Bar dataKey="avgHours" fill="#8b5cf6" name="Ø Stunden" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bewertungsverteilung ({ratings.length} Bewertungen)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ratingDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="star" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#fbbf24" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}