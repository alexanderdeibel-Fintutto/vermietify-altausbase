import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Clock, AlertCircle, BarChart3, TrendingUp } from 'lucide-react';

export default function TesterActivityAnalytics() {
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // Fetch test accounts
  const { data: testAccounts } = useQuery({
    queryKey: ['testAccounts'],
    queryFn: () => base44.entities.TestAccount.list('-last_activity', 100)
  });

  // Fetch activities
  const { data: activities } = useQuery({
    queryKey: ['allActivities'],
    queryFn: async () => {
      if (!testAccounts || testAccounts.length === 0) return [];
      return base44.entities.TesterActivity.list('-timestamp', 1000);
    },
    enabled: !!testAccounts
  });

  // Fetch problem reports
  const { data: problems } = useQuery({
    queryKey: ['testerProblems'],
    queryFn: () => base44.entities.UserProblem.filter({ status: ['open', 'triaged'] })
  });

  // Calculate statistics
  const stats = {
    activeTesters: testAccounts?.filter(t => t.is_active).length || 0,
    totalSessions: testAccounts?.reduce((sum, t) => sum + (t.total_sessions || 0), 0) || 0,
    totalProblems: problems?.length || 0,
    avgSessionMinutes: testAccounts?.length > 0 
      ? Math.round(testAccounts.reduce((sum, t) => sum + (t.total_session_minutes || 0), 0) / testAccounts.length)
      : 0
  };

  // Activity timeline
  const activityTimeline = activities?.reduce((acc, activity) => {
    const hour = new Date(activity.timestamp).getHours();
    const existing = acc.find(a => a.hour === hour);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ hour: `${hour}:00`, count: 1 });
    }
    return acc;
  }, []) || [];

  // Problem breakdown
  const problemBreakdown = [
    {
      name: 'Funktional',
      value: problems?.filter(p => p.problem_type === 'functional_bug').length || 0,
      color: '#ef4444'
    },
    {
      name: 'UX',
      value: problems?.filter(p => p.problem_type === 'ux_issue').length || 0,
      color: '#f59e0b'
    },
    {
      name: 'Performance',
      value: problems?.filter(p => p.problem_type === 'performance').length || 0,
      color: '#3b82f6'
    },
    {
      name: 'Visual',
      value: problems?.filter(p => p.problem_type === 'visual_bug').length || 0,
      color: '#8b5cf6'
    },
    {
      name: 'Sonstiges',
      value: problems?.filter(p => !['functional_bug', 'ux_issue', 'performance', 'visual_bug'].includes(p.problem_type)).length || 0,
      color: '#6b7280'
    }
  ];

  // Tester activity heatmap
  const testerHeatmap = testAccounts?.map(tester => ({
    name: tester.tester_name,
    sessions: tester.total_sessions || 0,
    pages: tester.pages_visited || 0,
    problems: tester.problems_reported || 0,
    minutes: tester.total_session_minutes || 0
  })) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-slate-800">Tester-Aktivitäten</h1>
        <p className="text-sm font-light text-slate-500 mt-2">Überblick über alle Test-Sessions und Feedback</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-light text-slate-500">Aktive Tester</p>
              <p className="text-2xl font-light text-slate-800 mt-1">{stats.activeTesters}</p>
            </div>
            <Users className="w-10 h-10 text-blue-100" />
          </div>
        </Card>

        <Card className="p-6 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-light text-slate-500">Gesamt Sessions</p>
              <p className="text-2xl font-light text-slate-800 mt-1">{stats.totalSessions}</p>
            </div>
            <Clock className="w-10 h-10 text-green-100" />
          </div>
        </Card>

        <Card className="p-6 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-light text-slate-500">Gemeldete Probleme</p>
              <p className="text-2xl font-light text-slate-800 mt-1">{stats.totalProblems}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-100" />
          </div>
        </Card>

        <Card className="p-6 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-light text-slate-500">Ø Session-Zeit</p>
              <p className="text-2xl font-light text-slate-800 mt-1">{stats.avgSessionMinutes} min</p>
            </div>
            <TrendingUp className="w-10 h-10 text-amber-100" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
          <TabsTrigger value="problems">Problem Breakdown</TabsTrigger>
          <TabsTrigger value="testers">Tester Details</TabsTrigger>
        </TabsList>

        {/* Activity Timeline */}
        <TabsContent value="timeline">
          <Card className="p-6">
            <h3 className="text-lg font-light text-slate-800 mb-4">Aktivitäten pro Stunde</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Problem Breakdown */}
        <TabsContent value="problems">
          <Card className="p-6">
            <h3 className="text-lg font-light text-slate-800 mb-4">Gemeldete Probleme nach Typ</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={problemBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {problemBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Tester Details */}
        <TabsContent value="testers">
          <Card className="p-6">
            <h3 className="text-lg font-light text-slate-800 mb-4">Tester Performance</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={testerHeatmap}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sessions" fill="#3b82f6" name="Sessions" />
                <Bar dataKey="pages" fill="#10b981" name="Seiten" />
                <Bar dataKey="problems" fill="#ef4444" name="Probleme" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Testers */}
      <Card className="p-6">
        <h3 className="text-lg font-light text-slate-800 mb-4">Aktive Tester</h3>
        <div className="space-y-2">
          {testAccounts?.filter(t => t.is_active).slice(0, 10).map(tester => (
            <div key={tester.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-light text-slate-800">{tester.tester_name}</p>
                <p className="text-xs font-light text-slate-500">{tester.test_email}</p>
              </div>
              <div className="text-right text-xs font-light text-slate-600">
                <p>{tester.total_sessions} Sessions • {tester.problems_reported} Probleme</p>
                <p>Zuletzt: {tester.last_activity ? new Date(tester.last_activity).toLocaleTimeString('de-DE') : '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}