import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Play, Pause, Trash2 } from 'lucide-react';

export default function ScheduledTasksPage() {
  const tasks = [
    { id: 1, name: 'Täglicher Backup', schedule: 'Täglich 02:00 Uhr', status: 'active', lastRun: 'Heute 02:15', nextRun: 'Morgen 02:00' },
    { id: 2, name: 'Wöchentlicher Report', schedule: 'Montag 09:00 Uhr', status: 'active', lastRun: '04.01.2026 09:05', nextRun: '13.01.2026 09:00' },
    { id: 3, name: 'Datenbankoptimierung', schedule: 'Sonntag 03:00 Uhr', status: 'paused', lastRun: '05.01.2026 03:30', nextRun: 'Pausiert' },
    { id: 4, name: 'Email-Cleanup', schedule: 'Täglich 23:00 Uhr', status: 'active', lastRun: 'Heute 23:02', nextRun: 'Morgen 23:00' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📅 Geplante Aufgaben</h1>
          <p className="text-slate-600 mt-1">Verwalten Sie automatisierte Aufgaben</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700"><Calendar className="w-4 h-4 mr-2" />Neue Aufgabe</Button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">{task.name}</h3>
                    <Badge className={task.status === 'active' ? 'bg-green-600' : 'bg-slate-600'}>
                      {task.status === 'active' ? 'Aktiv' : 'Pausiert'}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {task.schedule}</span>
                    <span>Zuletzt: {task.lastRun}</span>
                    <span>Nächstes Mal: {task.nextRun}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost">{task.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</Button>
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