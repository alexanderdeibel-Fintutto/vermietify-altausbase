import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, Wrench, Users, MessageSquare, 
  CheckCircle, AlertCircle, Building2, Plus
} from 'lucide-react';
import MobileMeterScanner from '@/components/meters/MobileMeterScanner';
import OfflineMeterQueue from '@/components/meters/OfflineMeterQueue';
import QuickTaskCreator from '@/components/vermieter-go/QuickTaskCreator';
import TenantQuickView from '@/components/vermieter-go/TenantQuickView';
import BuildingBoardMobile from '@/components/vermieter-go/BuildingBoardMobile';
import QuickStats from '@/components/vermieter-go/QuickStats';

export default function VermieterGo() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list('-name', 100)
  });

  const { data: todayTasks = [] } = useQuery({
    queryKey: ['todayTasks'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      return await base44.entities.BuildingTask.filter(
        { 
          status: { $in: ['open', 'assigned', 'in_progress'] },
          assigned_to: user?.email
        },
        '-priority',
        20
      );
    },
    enabled: !!user
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Vermieter Go</h1>
              <p className="text-xs text-blue-100">Mobiler Außendienst</p>
            </div>
          </div>
          <Badge className="bg-white text-blue-900">
            {todayTasks.length} Tasks
          </Badge>
        </div>

        {/* Building Selector */}
        <select
          value={selectedBuilding || ''}
          onChange={(e) => setSelectedBuilding(e.target.value || null)}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white backdrop-blur"
        >
          <option value="">Alle Gebäude</option>
          {buildings.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Stats */}
        <QuickStats buildingId={selectedBuilding} />

        {/* Offline Queue */}
        <OfflineMeterQueue />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-white">
            <TabsTrigger value="dashboard">
              <Building2 className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="meter">
              <Camera className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <Wrench className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="tenants">
              <Users className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {/* Today's Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Heutige Aufgaben
                  <Badge>{todayTasks.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayTasks.length > 0 ? (
                  <div className="space-y-2">
                    {todayTasks.slice(0, 5).map(task => (
                      <div key={task.id} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{task.task_title}</p>
                            <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                          </div>
                          <Badge className={
                            task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-600 py-4">Keine offenen Aufgaben</p>
                )}
              </CardContent>
            </Card>

            {/* Building Board */}
            <BuildingBoardMobile buildingId={selectedBuilding} />
          </TabsContent>

          <TabsContent value="meter">
            <MobileMeterScanner buildingId={selectedBuilding} />
          </TabsContent>

          <TabsContent value="tasks">
            <QuickTaskCreator buildingId={selectedBuilding} />
          </TabsContent>

          <TabsContent value="tenants">
            <TenantQuickView buildingId={selectedBuilding} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg">
        <div className="grid grid-cols-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 flex flex-col items-center gap-1 ${
              activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-xs">Übersicht</span>
          </button>
          <button
            onClick={() => setActiveTab('meter')}
            className={`py-4 flex flex-col items-center gap-1 ${
              activeTab === 'meter' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Camera className="w-5 h-5" />
            <span className="text-xs">Zähler</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-4 flex flex-col items-center gap-1 ${
              activeTab === 'tasks' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Wrench className="w-5 h-5" />
            <span className="text-xs">Aufgaben</span>
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`py-4 flex flex-col items-center gap-1 ${
              activeTab === 'tenants' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">Mieter</span>
          </button>
        </div>
      </div>
    </div>
  );
}