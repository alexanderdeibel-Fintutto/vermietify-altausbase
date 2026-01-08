import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Play, Settings, Clock, CheckCircle } from 'lucide-react';

export default function WorkflowAutomationHubPage() {
  const workflows = [
    { id: 1, name: 'Mieter Onboarding', status: 'active', executions: 24, lastRun: 'Heute 14:30', nextRun: 'Morgen 08:00' },
    { id: 2, name: 'Mahnung Workflow', status: 'active', executions: 156, lastRun: 'Heute 10:15', nextRun: 'Morgen 06:00' },
    { id: 3, name: 'Wartungsplanung', status: 'paused', executions: 42, lastRun: '05.01.2026', nextRun: 'Pausiert' },
    { id: 4, name: 'Report Generator', status: 'active', executions: 12, lastRun: '07.01.2026 18:00', nextRun: '14.01.2026 18:00' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">⚡ Workflow Automation Hub</h1>
          <p className="text-slate-600 mt-1">Erstellen und verwalten Sie automatisierte Workflows</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700"><Zap className="w-4 h-4 mr-2" />Neuer Workflow</Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Aktive Workflows</TabsTrigger>
          <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3">
          {workflows.map((wf) => (
            <Card key={wf.id} className="border border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="w-5 h-5 text-violet-600" />
                      <h3 className="font-semibold text-slate-900">{wf.name}</h3>
                      <Badge className={wf.status === 'active' ? 'bg-green-600' : 'bg-slate-600'}>
                        {wf.status === 'active' ? '✓ Aktiv' : '⏸ Pausiert'}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-600 ml-8">
                      <span>Ausführungen: {wf.executions}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Zuletzt: {wf.lastRun}</span>
                      <span>Nächst: {wf.nextRun}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      {wf.status === 'active' ? 'Pause' : 'Starten'}
                    </Button>
                    <Button size="sm" variant="ghost"><Settings className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="builder">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle>Workflow Builder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-center">
                <p className="text-slate-600">Ziehen Sie Trigger und Aktionen hier ein um einen Workflow zu erstellen</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-violet-200 bg-violet-50 rounded-lg cursor-move">
                  <p className="text-sm font-semibold text-violet-900">📅 Zeitbasiert</p>
                </div>
                <div className="p-3 border border-violet-200 bg-violet-50 rounded-lg cursor-move">
                  <p className="text-sm font-semibold text-violet-900">📋 Ereignis</p>
                </div>
                <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg cursor-move">
                  <p className="text-sm font-semibold text-blue-900">📧 Email senden</p>
                </div>
                <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg cursor-move">
                  <p className="text-sm font-semibold text-blue-900">✅ Aufgabe erstellen</p>
                </div>
              </div>
              <Button className="w-full bg-violet-600 hover:bg-violet-700">Speichern</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}