import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function UpcomingTasksWidget() {
  const tasks = [
    { title: 'Wartung Gebäude A', date: 'Heute', priority: 'high' },
    { title: 'Mietzahlung einziehen', date: 'Morgen', priority: 'high' },
    { title: 'Versicherung prüfen', date: 'In 3 Tagen', priority: 'medium' },
    { title: 'Wartungsbericht', date: 'In 5 Tagen', priority: 'low' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Anstehende Aufgaben
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.map((task, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50">
              <div>
                <p className="text-xs font-medium text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-500">{task.date}</p>
              </div>
              <Badge className={task.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                {task.priority}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}