import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Camera, MapPin, Clock, CheckSquare, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function VermieterGoApp() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const allTasks = await base44.entities.Task.list('-created_date', 20);
      return allTasks.filter(t => t.status !== 'completed');
    }
  });

  const mobileFeatures = [
    { 
      title: 'Schnellerfassung', 
      icon: Camera, 
      description: 'Fotos und Notizen vor Ort erfassen',
      path: 'StaffMobileApp',
      color: 'bg-blue-500'
    },
    { 
      title: 'Zählerstände', 
      icon: Smartphone, 
      description: 'Mobil scannen und erfassen',
      path: 'MobileMeterScanning',
      color: 'bg-green-500'
    },
    { 
      title: 'Navigation', 
      icon: MapPin, 
      description: 'Optimierte Routenplanung',
      path: 'Buildings',
      color: 'bg-purple-500'
    },
    { 
      title: 'Tagesplaner', 
      icon: Clock, 
      description: 'Termine und Aufgaben mobil',
      path: 'Tasks',
      color: 'bg-orange-500'
    },
    { 
      title: 'Wartung', 
      icon: CheckSquare, 
      description: 'Checklisten und Protokolle',
      path: 'MaintenanceTasks',
      color: 'bg-red-500'
    },
    { 
      title: 'Kommunikation', 
      icon: MessageSquare, 
      description: 'Direkter Kontakt zum Team',
      path: 'TenantCommunicationCenter',
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Vermieter Go</h1>
          <p className="text-slate-600">Mobile Hausverwaltung unterwegs</p>
        </div>

        <Card className="bg-green-600 text-white">
          <CardHeader>
            <CardTitle className="text-white">Hallo {user?.full_name?.split(' ')[0] || 'Admin'}!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-90 mb-2">Offene Aufgaben heute:</p>
            <p className="text-4xl font-bold">{tasks.length}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          {mobileFeatures.map((feature) => (
            <Link key={feature.title} to={createPageUrl(feature.path)}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 ${feature.color} rounded-xl mx-auto mb-3 flex items-center justify-center`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Heute anstehend</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-4">Keine offenen Aufgaben</p>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-slate-600">{task.description?.substring(0, 50)}...</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}