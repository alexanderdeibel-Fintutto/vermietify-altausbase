import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Zap, Target, TrendingUp } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';

export default function TestingDashboardPage() {
  const assignments = [
    { id: 1, name: 'Header Navigation testen', assignedTo: 'John Doe', status: 'in_progress', progress: 65, dueDate: '2026-01-10' },
    { id: 2, name: 'Mietvertrag-Workflow', assignedTo: 'Jane Smith', status: 'completed', progress: 100, dueDate: '2026-01-08' },
    { id: 3, name: 'Zahlungssystem', assignedTo: 'Bob Wilson', status: 'pending', progress: 0, dueDate: '2026-01-15' },
    { id: 4, name: 'Mobile Responsiveness', assignedTo: 'Alice Brown', status: 'in_progress', progress: 48, dueDate: '2026-01-12' },
  ];

  const testers = [
    { name: 'John Doe', sessions: 24, reports: 12, avgQuality: 4.8 },
    { name: 'Jane Smith', sessions: 18, reports: 8, avgQuality: 4.9 },
    { name: 'Bob Wilson', sessions: 15, reports: 5, avgQuality: 4.6 },
  ];

  const stats = [
    { label: 'Aktive Tester', value: testers.length },
    { label: 'Test-Sessions (Monat)', value: testers.reduce((sum, t) => sum + t.sessions, 0) },
    { label: 'Issues gemeldet', value: testers.reduce((sum, t) => sum + t.reports, 0) },
    { label: 'Avg. Qualität', value: '4.8⭐' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🧪 Testing Dashboard</h1>
          <p className="text-slate-600 mt-1">Übersicht über alle Test-Aktivitäten</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700"><Zap className="w-4 h-4 mr-2" />Neue Aufgabe</Button>
      </div>

      <QuickStats stats={stats} accentColor="cyan" />

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="font-bold text-slate-900">Test-Aufgaben</h2>
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="border border-slate-200">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{assignment.name}</h3>
                    <Badge className={assignment.status === 'completed' ? 'bg-green-600' : assignment.status === 'in_progress' ? 'bg-blue-600' : 'bg-slate-600'}>
                      {assignment.status === 'completed' ? '✓' : assignment.status === 'in_progress' ? 'In Arbeit' : 'Ausstehend'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">{assignment.assignedTo}</p>
                  <Progress value={assignment.progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-slate-900">Top Tester</h2>
          {testers.map((tester, idx) => (
            <Card key={idx} className="border border-slate-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900">{tester.name}</h3>
                  <span className="text-sm font-bold text-amber-600">⭐ {tester.avgQuality}</span>
                </div>
                <p className="text-xs text-slate-600">{tester.sessions} Sessions • {tester.reports} Reports</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}