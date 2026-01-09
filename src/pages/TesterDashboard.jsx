import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTesterTracker } from '@/components/hooks/useTesterTracker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { LogOut, Clock, Eye, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

export default function TesterDashboard() {
  const [testAccountId, setTestAccountId] = useState(null);
  const [user, setUser] = useState(null);

  // Get current user and their test account
  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const testAccounts = await base44.entities.TestAccount.filter(
          { tester_id: currentUser.id, is_active: true },
          '-created_date',
          1
        );
        
        if (testAccounts[0]) {
          setTestAccountId(testAccounts[0].id);
        }
      } catch (err) {
        console.error('Init failed:', err);
      }
    };
    init();
  }, []);

  // Start tracking
  useTesterTracker(testAccountId);

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['testerDashboard', testAccountId],
    queryFn: () => base44.functions.invoke('getTesterDashboardData', { test_account_id: testAccountId }),
    enabled: !!testAccountId,
    refetchInterval: 5000
  });

  const handleLogout = async () => {
    if (testAccountId) {
      try {
        await base44.functions.invoke('endTestSession', { test_account_id: testAccountId });
      } catch (err) {
        console.error('Session end failed:', err);
      }
    }
    base44.auth.logout();
  };

  if (isLoading || !dashboardData?.data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Zap className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const data = dashboardData.data;
  const stats = data.session_stats;
  const assignments = data.assignments || [];
  const problems = data.problems || [];
  const activities = data.activities || [];

  const completedAssignments = assignments.filter(a => a.status === 'completed').length;
  const completionPercentage = assignments.length > 0 ? Math.round((completedAssignments / assignments.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-slate-900 mb-1">
              Test-Dashboard 👋 {user?.full_name}
            </h1>
            {data.active_session && (
              <p className="text-sm font-light text-slate-600">
                🟢 Aktive Test-Session seit {format(new Date(data.active_session.started_at), 'HH:mm:ss', { locale: de })}
              </p>
            )}
          </div>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="gap-2 font-light"
          >
            <LogOut className="w-4 h-4" />
            Test beenden
          </Button>
        </div>

        {/* Three Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Progress Card */}
          <Card className="p-6 bg-white border border-slate-200">
            <h2 className="text-lg font-light text-slate-900 mb-4">📊 Test-Fortschritt</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-light text-slate-600 mb-1">Abschluss</p>
                <Progress value={completionPercentage} className="h-2" />
                <p className="text-sm font-light text-slate-700 mt-1">{completionPercentage}% erledigt</p>
              </div>

              <div className="space-y-1 text-sm font-light text-slate-700">
                <p>⏱️ Online: {stats.total_minutes} Minuten</p>
                <p>👁️ Seiten besucht: {stats.pages_visited}</p>
                <p>🐛 Probleme gemeldet: {stats.problems_reported}</p>
                <p>📅 Sessions: {stats.total_sessions}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <h3 className="font-light text-slate-700 mb-2 text-sm">🎯 Aufgaben ({completedAssignments}/{assignments.length})</h3>
              <div className="space-y-1">
                {assignments.slice(0, 6).map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-xs font-light">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-slate-300" />
                    )}
                    <span className={task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700'}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Problems Card */}
          <Card className="p-6 bg-white border border-slate-200">
            <h2 className="text-lg font-light text-slate-900 mb-4">🐛 Gemeldete Probleme</h2>
            
            <div className="space-y-2">
              {problems.slice(0, 5).map(problem => (
                <div key={problem.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-light text-slate-900 mb-1">{problem.problem_titel}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs h-5 font-light">
                      {problem.status}
                    </Badge>
                    {problem.priority_score && (
                      <Badge className="text-xs h-5 font-light bg-slate-700">
                        Score: {Math.round(problem.priority_score)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {problems.length === 0 && (
                <p className="text-sm font-light text-slate-500 text-center py-4">Noch keine Probleme gemeldet</p>
              )}
            </div>
          </Card>

          {/* Activity Card */}
          <Card className="p-6 bg-white border border-slate-200">
            <h2 className="text-lg font-light text-slate-900 mb-4">⚡ Letzte Aktivitäten</h2>
            
            <div className="space-y-1 text-xs font-light">
              {activities.slice(0, 8).map((activity, idx) => (
                <div key={idx} className="flex items-start gap-2 py-1">
                  <span className="text-slate-500">
                    {format(new Date(activity.timestamp), 'HH:mm:ss', { locale: de })}
                  </span>
                  <span className="text-slate-700">-</span>
                  <span className="text-slate-600">
                    {activity.activity_type === 'page_visit' && '👁️ Seite besucht'}
                    {activity.activity_type === 'click' && '🖱️ Klick'}
                    {activity.activity_type === 'problem_report' && '🐛 Problem gemeldet'}
                    {activity.activity_type === 'form_submit' && '📝 Formular gesendet'}
                    {activity.activity_type === 'scroll' && '⬇️ Gescrollt'}
                    {activity.page_title && ` - ${activity.page_title.slice(0, 30)}`}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Assignments & Problems Tabs */}
        <Tabs defaultValue="assignments" className="bg-white rounded-lg border border-slate-200">
          <TabsList className="grid w-full grid-cols-2 border-b border-slate-200 bg-slate-50 font-light">
            <TabsTrigger value="assignments">📋 Test-Aufgaben ({assignments.length})</TabsTrigger>
            <TabsTrigger value="problems">🐛 Problem-Historie ({problems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="p-6 space-y-3">
            {assignments.map(assignment => (
              <Card key={assignment.id} className="p-4 border border-slate-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-light text-slate-900">{assignment.title}</h3>
                    <p className="text-sm font-light text-slate-600 mt-1">{assignment.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs font-light">
                        {assignment.category}
                      </Badge>
                      <Badge className={`text-xs font-light ${
                        assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {assignment.status}
                      </Badge>
                      {assignment.estimated_duration && (
                        <span className="text-xs font-light text-slate-500 ml-auto">
                          ⏱️ {assignment.estimated_duration} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="problems" className="p-6 space-y-3">
            {problems.map(problem => (
              <Card key={problem.id} className="p-4 border border-slate-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-light text-slate-900">{problem.problem_titel}</h3>
                    <p className="text-sm font-light text-slate-600 mt-1">{problem.problem_beschreibung}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className={`text-xs font-light ${
                        problem.functional_severity === 'app_breaking' ? 'bg-red-100 text-red-800' :
                        problem.functional_severity === 'feature_blocking' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {problem.functional_severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-light">{problem.status}</Badge>
                      {problem.priority_score && (
                        <Badge className="text-xs font-light bg-slate-700">
                          Score: {Math.round(problem.priority_score)}
                        </Badge>
                      )}
                      <span className="text-xs font-light text-slate-500 ml-auto">
                        {format(new Date(problem.created_date), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}