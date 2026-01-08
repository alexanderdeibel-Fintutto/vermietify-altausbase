import React from 'react';
import { useQuery } from '@tantml:react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Clock, Star, Target } from 'lucide-react';

export default function TestSessionAnalytics({ userId }) {
  const { data: sessions = [] } = useQuery({
    queryKey: ['test-sessions', userId],
    queryFn: () => userId 
      ? base44.asServiceRole.entities.TestSession.filter({ user_id: userId })
      : base44.asServiceRole.entities.TestSession.list(),
    enabled: true
  });

  const totalDuration = sessions.reduce((sum, s) => sum + (s.total_duration || 0), 0);
  const avgDuration = sessions.length > 0 ? totalDuration / sessions.length : 0;
  const totalActions = sessions.reduce((sum, s) => sum + (s.actions_performed?.length || 0), 0);
  const avgRating = sessions.filter(s => s.feedback_rating).reduce((sum, s) => sum + s.feedback_rating, 0) / sessions.filter(s => s.feedback_rating).length || 0;

  // Features tested frequency
  const featureCount = {};
  sessions.forEach(s => {
    s.features_tested?.forEach(feature => {
      featureCount[feature] = (featureCount[feature] || 0) + 1;
    });
  });

  const featureData = Object.entries(featureCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Sessions per day
  const sessionsByDay = {};
  sessions.forEach(s => {
    const day = new Date(s.session_start).toLocaleDateString('de-DE');
    sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
  });

  const sessionData = Object.entries(sessionsByDay)
    .map(([day, count]) => ({ day, count }))
    .slice(-7);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Sessions</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Ø Dauer</p>
                <p className="text-2xl font-bold">{Math.round(avgDuration)} Min</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Aktionen</p>
                <p className="text-2xl font-bold">{totalActions}</p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Ø Rating</p>
                <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sessions pro Tag (letzte 7 Tage)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sessionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Features getestet</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={featureData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Letzte Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessions.slice(0, 5).map(session => (
              <div key={session.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-medium">
                    {new Date(session.session_start).toLocaleString('de-DE')}
                  </div>
                  <Badge>{session.total_duration || 0} Min</Badge>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Aktionen: {session.actions_performed?.length || 0}</div>
                  <div>Features: {session.features_tested?.length || 0}</div>
                  {session.feedback_rating && (
                    <div className="flex items-center gap-1">
                      Rating: <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      {session.feedback_rating}/5
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}