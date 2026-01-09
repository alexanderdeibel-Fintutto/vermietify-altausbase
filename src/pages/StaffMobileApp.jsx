import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardList, Building2, CheckCircle, User,
  AlertCircle, Calendar, TrendingUp
} from 'lucide-react';
import { usePushNotifications } from '@/components/mobile/usePushNotifications';

export default function StaffMobileApp() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [user, setUser] = useState(null);
  const { isSupported, isSubscribed, subscribe } = usePushNotifications();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('User load error:', error);
      }
    };
    loadUser();
  }, []);

  const { data: manager } = useQuery({
    queryKey: ['currentManager', user?.email],
    queryFn: async () => {
      const managers = await base44.entities.BuildingManager.filter({ user_email: user.email }, null, 1);
      return managers[0];
    },
    enabled: !!user?.email
  });

  const { data: myTasks = [] } = useQuery({
    queryKey: ['staffTasks', user?.email],
    queryFn: () => base44.entities.BuildingTask.filter({ 
      assigned_to: user.email,
      status: { $ne: 'completed' }
    }, '-priority', 50),
    enabled: !!user?.email
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['assignedBuildings', manager?.assigned_buildings],
    queryFn: async () => {
      if (!manager?.assigned_buildings?.length) return [];
      const allBuildings = await base44.entities.Building.list(null, 100);
      return allBuildings.filter(b => manager.assigned_buildings.includes(b.id));
    },
    enabled: !!manager?.assigned_buildings
  });

  const urgentTasks = myTasks.filter(t => t.priority === 'urgent');
  const dueTodayTasks = myTasks.filter(t => {
    if (!t.due_date) return false;
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(t.due_date).toISOString().split('T')[0];
    return dueDate === today;
  });

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    open: 'bg-slate-100 text-slate-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    blocked: 'bg-red-100 text-red-800'
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Mitarbeiter-App</h1>
              <p className="text-sm text-slate-300">{user.full_name}</p>
              {manager && (
                <Badge className="mt-1 bg-white/20 text-white">{manager.role}</Badge>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold">{myTasks.length}</p>
              <p className="text-xs text-slate-300">Offen</p>
            </div>
            <div className="bg-red-500/30 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold">{urgentTasks.length}</p>
              <p className="text-xs text-slate-300">Dringend</p>
            </div>
            <div className="bg-amber-500/30 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold">{dueTodayTasks.length}</p>
              <p className="text-xs text-slate-300">Heute</p>
            </div>
          </div>

          {/* Push Notification Banner */}
          {isSupported && !isSubscribed && (
            <div className="mt-3 bg-slate-600 rounded-lg p-3 flex items-center justify-between">
              <p className="text-sm">Push-Benachrichtigungen aktivieren</p>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={subscribe}
                className="bg-white text-slate-900"
              >
                Aktivieren
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-4">
        {/* My Tasks */}
        <div className="space-y-3">
          {myTasks.map(task => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold">{task.task_title}</h4>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{task.description}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className={priorityColors[task.priority]}>
                      {task.priority}
                    </Badge>
                    <Badge className={statusColors[task.status]}>
                      {task.status}
                    </Badge>
                  </div>
                </div>

                {task.due_date && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
                    <Calendar className="w-3 h-3" />
                    Fällig: {new Date(task.due_date).toLocaleDateString('de-DE')}
                  </div>
                )}

                {task.depends_on?.length > 0 && (
                  <div className="mt-2 p-2 bg-amber-50 rounded flex items-center gap-2 text-xs text-amber-800">
                    <AlertCircle className="w-3 h-3" />
                    {task.depends_on.length} Abhängigkeit(en)
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1">
                    Details
                  </Button>
                  {task.status !== 'completed' && (
                    <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Erledigt
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Assigned Buildings */}
        {buildings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meine Gebäude</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {buildings.map(building => (
                <div key={building.id} className="p-3 bg-slate-50 rounded flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-slate-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{building.name}</p>
                    <p className="text-xs text-slate-600">{building.address}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}