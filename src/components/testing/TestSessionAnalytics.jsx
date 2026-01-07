import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function TestSessionAnalytics() {
  const { data: sessions = [] } = useQuery({
    queryKey: ['test-sessions'],
    queryFn: () => base44.asServiceRole.entities.TestSession.list('-session_start')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const allUsers = await base44.asServiceRole.entities.User.list();
      return allUsers.filter(u => u.is_tester);
    }
  });

  // Statistiken
  const completedSessions = sessions.filter(s => s.session_end);
  const avgDuration = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.total_duration || 0), 0) / completedSessions.length)
    : 0;

  // Sessions pro Tester
  const sessionsByUser = {};
  sessions.forEach(s => {
    sessionsByUser[s.user_id] = (sessionsByUser[s.user_id] || 0) + 1;
  });

  const userSessionData = Object.entries(sessionsByUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, count]) => {
      const user = users.find(u => u.id === userId);
      return {
        name: user?.full_name || user?.email || userId,
        sessions: count
      };
    });

  // Features getestet
  const featureCount = {};
  sessions.forEach(s => {
    (s.features_tested || []).forEach(feature => {
      featureCount[feature] = (featureCount[feature] || 0) + 1;
    });
  });

  const topFeatures = Object.entries(featureCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([feature, count]) => ({ name: feature, value: count }));

  // Rating-Verteilung
  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating: `${rating} ⭐`,
    count: sessions.filter(s => s.feedback_rating === rating).length
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{sessions.length}</div>
            <div className="text-sm text-slate-600">Gesamt-Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{completedSessions.length}</div>
            <div className="text-sm text-slate-600">Abgeschlossen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">{avgDuration}m</div>
            <div className="text-sm text-slate-600">Ø Dauer</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-orange-600">{users.length}</div>
            <div className="text-sm text-slate-600">Aktive Tester</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sessions pro Tester</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userSessionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sessions" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meistgetestete Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topFeatures}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {topFeatures.map((entry, index) => (
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
            <CardTitle>Feedback-Bewertungen</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Letzte Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {sessions.slice(0, 10).map(session => {
                const user = users.find(u => u.id === session.user_id);
                return (
                  <div key={session.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        {user?.full_name || user?.email || 'Unbekannt'}
                      </span>
                      <Badge variant="outline">{session.total_duration || 0}m</Badge>
                    </div>
                    <div className="text-xs text-slate-600">
                      {new Date(session.session_start).toLocaleString('de-DE')}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}