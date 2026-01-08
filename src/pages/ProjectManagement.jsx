import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Users, Calendar, AlertCircle } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';

export default function ProjectManagementPage() {
  const projects = [
    { id: 1, name: 'ELSTER Integration', status: 'in_progress', progress: 75, team: 4, dueDate: '2026-02-15', priority: 'high' },
    { id: 2, name: 'WhatsApp Bot', status: 'in_progress', progress: 45, team: 2, dueDate: '2026-03-01', priority: 'medium' },
    { id: 3, name: 'Mobile App', status: 'planning', progress: 20, team: 6, dueDate: '2026-04-30', priority: 'high' },
    { id: 4, name: 'AI Kategorisierung', status: 'completed', progress: 100, team: 3, dueDate: '2026-01-05', priority: 'medium' },
  ];

  const stats = [
    { label: 'Gesamt Projekte', value: projects.length },
    { label: 'In Bearbeitung', value: projects.filter(p => p.status === 'in_progress').length },
    { label: 'Abgeschlossen', value: projects.filter(p => p.status === 'completed').length },
    { label: 'Team-Mitglieder', value: projects.reduce((sum, p) => sum + p.team, 0) },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'in_progress': return 'bg-blue-600';
      case 'planning': return 'bg-orange-600';
      case 'completed': return 'bg-green-600';
      default: return 'bg-slate-600';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'in_progress': return 'In Bearbeitung';
      case 'planning': return 'Planung';
      case 'completed': return 'Abgeschlossen';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📁 Projektmanagement</h1>
          <p className="text-slate-600 mt-1">Verwalten Sie alle Entwicklungsprojekte</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" />Neues Projekt</Button>
      </div>

      <QuickStats stats={stats} accentColor="indigo" />

      <div className="space-y-3">
        {projects.map((project) => (
          <Card key={project.id} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">{project.name}</h3>
                    <Badge className={getStatusColor(project.status)}>{getStatusLabel(project.status)}</Badge>
                    {project.priority === 'high' && <Badge className="bg-red-600">🔴 High</Badge>}
                  </div>
                  <div className="flex gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {project.team} Team</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Fällig: 15.02.26</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Fortschritt</span>
                  <span className="font-semibold text-slate-900">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}