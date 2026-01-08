import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Pause, Trash2, Edit2, Zap } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';

export default function WorkflowAutomationPage() {
  const workflows = [
    { id: 1, name: 'Zahlungserinnerung', trigger: 'Zahlung überfällig', actions: 3, active: true, runs: 245 },
    { id: 2, name: 'Mietvertrag Verlängerung', trigger: 'Vertrag endet in 60 Tagen', actions: 2, active: true, runs: 89 },
    { id: 3, name: 'Belegarchivierung', trigger: 'Monatlich', actions: 4, active: true, runs: 12 },
    { id: 4, name: 'Tenant Onboarding', trigger: 'Neuer Mieter hinzugefügt', actions: 5, active: false, runs: 156 },
  ];

  const stats = [
    { label: 'Aktive Workflows', value: workflows.filter(w => w.active).length },
    { label: 'Gesamtläufe', value: workflows.reduce((sum, w) => sum + w.runs, 0) },
    { label: 'Automatisierte Aufgaben', value: workflows.reduce((sum, w) => sum + w.actions, 0) },
    { label: 'Zeit gespart', value: '156h' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">⚙️ Workflow Automation</h1>
          <p className="text-slate-600 mt-1">Automatisieren Sie wiederkehrende Aufgaben</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4 mr-2" />Neuer Workflow</Button>
      </div>

      <QuickStats stats={stats} accentColor="blue" />

      <div className="space-y-3">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">{workflow.name}</h3>
                    {workflow.active ? (
                      <Badge className="bg-green-600">✓ Aktiv</Badge>
                    ) : (
                      <Badge variant="outline">Inaktiv</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">Trigger: {workflow.trigger}</p>
                  <div className="flex gap-4 mt-3 text-xs text-slate-500">
                    <span>🔗 {workflow.actions} Aktionen</span>
                    <span>📊 {workflow.runs} Läufe</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost"><Edit2 className="w-4 h-4 text-blue-600" /></Button>
                  <Button size="icon" variant="ghost">{workflow.active ? <Pause className="w-4 h-4 text-orange-600" /> : <Play className="w-4 h-4 text-green-600" />}</Button>
                  <Button size="icon" variant="ghost"><Trash2 className="w-4 h-4 text-red-600" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}