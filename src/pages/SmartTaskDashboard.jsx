import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, Calendar, TrendingUp, Zap, CheckCircle } from 'lucide-react';
import SmartTaskManager from '@/components/tasks/SmartTaskManager';
import AutoTaskCreator from '@/components/tasks/AutoTaskCreator';

export default function SmartTaskDashboard() {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list('-updated_date', 50)
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['allBuildingTasks'],
    queryFn: () => base44.entities.BuildingTask.list('-created_date', 200)
  });

  const aiGeneratedTasks = allTasks.filter(t => t.ai_generated);
  const recurringTasks = allTasks.filter(t => t.is_recurring);
  const openTasks = allTasks.filter(t => t.status === 'open');
  const urgentTasks = allTasks.filter(t => t.priority === 'urgent');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light text-slate-900">KI-Aufgabenverwaltung</h1>
        <p className="text-sm text-slate-600 mt-1">
          Intelligente Aufgabenerstellung und -planung mit KI-Unterstützung
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{aiGeneratedTasks.length}</p>
                <p className="text-sm text-slate-600">KI-Aufgaben</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{recurringTasks.length}</p>
                <p className="text-sm text-slate-600">Wiederkehrend</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Zap className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{urgentTasks.length}</p>
                <p className="text-sm text-slate-600">Dringend</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{openTasks.length}</p>
                <p className="text-sm text-slate-600">Offen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="auto" className="w-full">
        <TabsList>
          <TabsTrigger value="auto">
            <Sparkles className="w-4 h-4 mr-2" />
            Auto-Erstellung
          </TabsTrigger>
          <TabsTrigger value="recurring">
            <Calendar className="w-4 h-4 mr-2" />
            Wiederkehrende Aufgaben
          </TabsTrigger>
          <TabsTrigger value="overview">
            <TrendingUp className="w-4 h-4 mr-2" />
            Übersicht
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auto" className="space-y-4">
          <AutoTaskCreator />
        </TabsContent>

        <TabsContent value="recurring" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {buildings.map(building => (
              <SmartTaskManager key={building.id} buildingId={building.id} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alle KI-generierten Aufgaben</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {aiGeneratedTasks.length === 0 ? (
                  <p className="text-center text-slate-600 py-8">Noch keine KI-Aufgaben erstellt</p>
                ) : (
                  aiGeneratedTasks.slice(0, 10).map(task => (
                    <div key={task.id} className="p-3 bg-slate-50 rounded border flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{task.task_title}</h4>
                          <Badge className={
                            task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {task.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600">{task.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                          <Badge variant="outline">{task.task_type}</Badge>
                          {task.is_recurring && <Badge variant="outline">Wiederkehrend</Badge>}
                          {task.due_date && (
                            <span>Fällig: {new Date(task.due_date).toLocaleDateString('de-DE')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}