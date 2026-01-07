import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, Shield, Lock, Activity, TrendingUp, 
  AlertCircle, CheckCircle2, Clock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => await base44.asServiceRole.entities.User.list()
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['all-roles'],
    queryFn: () => base44.asServiceRole.entities.Role.list()
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const acts = await base44.asServiceRole.entities.UserActivity.list('-created_date');
      return acts.slice(0, 100);
    }
  });

  const { data: testSessions = [] } = useQuery({
    queryKey: ['test-sessions'],
    queryFn: () => base44.asServiceRole.entities.TestSession.list('-session_start')
  });

  const { data: roleAssignments = [] } = useQuery({
    queryKey: ['role-assignments'],
    queryFn: () => base44.asServiceRole.entities.UserRoleAssignment.list()
  });

  // Statistiken
  const activeUsers = users.filter(u => u.last_activity && 
    (new Date() - new Date(u.last_activity)) < 7 * 24 * 60 * 60 * 1000
  ).length;
  
  const testers = users.filter(u => u.is_tester).length;
  const admins = users.filter(u => u.role === 'admin').length;
  const activeRoles = roles.filter(r => r.is_active).length;
  const activeAssignments = roleAssignments.filter(ra => ra.is_active).length;

  // Aktivitäten der letzten 7 Tage
  const last7Days = Array.from({length: 7}, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const activityByDay = last7Days.map(date => ({
    date: new Date(date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }),
    activities: activities.filter(a => a.created_date.startsWith(date)).length,
    sessions: testSessions.filter(s => s.session_start.startsWith(date)).length
  }));

  // Aktivste Benutzer
  const userActivityCount = {};
  activities.forEach(a => {
    userActivityCount[a.user_id] = (userActivityCount[a.user_id] || 0) + 1;
  });

  const topUsers = Object.entries(userActivityCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([userId, count]) => {
      const user = users.find(u => u.id === userId);
      return {
        name: user?.full_name || user?.email || 'Unbekannt',
        count
      };
    });

  // Kürzliche Rollen-Änderungen
  const recentRoleChanges = roleAssignments
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600">System-Übersicht und Verwaltung</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(createPageUrl('UserManagement'))}>
            <Users className="w-4 h-4 mr-2" />
            Benutzer
          </Button>
          <Button variant="outline" onClick={() => navigate(createPageUrl('AuditReports'))}>
            <Activity className="w-4 h-4 mr-2" />
            Audit
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Gesamt-Benutzer</div>
                <div className="text-3xl font-bold text-blue-600">{users.length}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {activeUsers} aktiv (7 Tage)
                </div>
              </div>
              <Users className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Rollen & Zuweisungen</div>
                <div className="text-3xl font-bold text-green-600">{activeRoles}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {activeAssignments} aktive Zuweisungen
                </div>
              </div>
              <Shield className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Tester-Aktivität</div>
                <div className="text-3xl font-bold text-purple-600">{testSessions.length}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {testers} aktive Tester
                </div>
              </div>
              <Activity className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">System-Admins</div>
                <div className="text-3xl font-bold text-orange-600">{admins}</div>
                <div className="text-xs text-slate-500 mt-1">
                  von {users.length} Benutzern
                </div>
              </div>
              <Lock className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aktivitätsverlauf (7 Tage)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={activityByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="activities" stroke="#3b82f6" name="Aktivitäten" />
                <Line type="monotone" dataKey="sessions" stroke="#10b981" name="Test-Sessions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Aktivste Benutzer</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topUsers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Changes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Kürzliche Rollen-Änderungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRoleChanges.map(change => {
                const user = users.find(u => u.id === change.user_id);
                const role = roles.find(r => r.id === change.role_id);
                return (
                  <div key={change.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">
                        {user?.full_name || user?.email || 'Unbekannt'}
                      </div>
                      <div className="text-xs text-slate-600">
                        Rolle: {role?.name || 'Unbekannt'}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(change.created_date).toLocaleDateString('de-DE')}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System-Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-sm">Permissions-System</span>
                </div>
                <Badge variant="outline" className="bg-white">Aktiv</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-sm">Activity Logging</span>
                </div>
                <Badge variant="outline" className="bg-white">Aktiv</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-sm">Tester-Tracking</span>
                </div>
                <Badge variant="outline" className="bg-white">{testSessions.length} Sessions</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-sm">Module-System</span>
                </div>
                <Badge variant="outline" className="bg-white">Beta</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}