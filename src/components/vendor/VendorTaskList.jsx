import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Clock, Eye } from 'lucide-react';
import VendorTaskDetailDialog from '@/components/vendor/VendorTaskDetailDialog';

export default function VendorTaskList({ tasks, vendors, searchQuery }) {
  const [selectedTask, setSelectedTask] = useState(null);

  const filteredTasks = tasks.filter(t => {
    const vendor = vendors.find(v => v.id === t.vendor_id);
    return t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           vendor?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const statusColors = {
    pending: 'bg-slate-100 text-slate-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-amber-100 text-amber-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    on_hold: 'bg-purple-100 text-purple-800'
  };

  const statusLabels = {
    pending: 'Ausstehend',
    assigned: 'Zugewiesen',
    in_progress: 'In Bearbeitung',
    completed: 'Abgeschlossen',
    cancelled: 'Abgebrochen',
    on_hold: 'Pausiert'
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-slate-100 text-slate-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-3">
      {filteredTasks.map(task => {
        const vendor = vendors.find(v => v.id === task.vendor_id);
        
        return (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{task.title}</h3>
                    <Badge className={statusColors[task.status]}>
                      {statusLabels[task.status]}
                    </Badge>
                    <Badge className={priorityColors[task.priority]} variant="outline">
                      {task.priority}
                    </Badge>
                  </div>
                  {vendor && (
                    <p className="text-sm text-slate-600">Dienstleister: {vendor.company_name}</p>
                  )}
                  {task.description && (
                    <p className="text-sm text-slate-600 line-clamp-1 mt-1">{task.description}</p>
                  )}
                </div>
                {task.task_number && (
                  <Badge variant="outline">#{task.task_number}</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-600 mb-3">
                {task.scheduled_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(task.scheduled_date).toLocaleDateString('de-DE')}
                  </div>
                )}
                {task.actual_cost > 0 && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {task.actual_cost.toLocaleString('de-DE')}€
                  </div>
                )}
                {task.actual_hours > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {task.actual_hours}h
                  </div>
                )}
                {task.paid && (
                  <Badge className="bg-green-100 text-green-800 text-xs">Bezahlt</Badge>
                )}
              </div>

              <Button size="sm" variant="outline" onClick={() => setSelectedTask(task)} className="w-full">
                <Eye className="w-3 h-3 mr-1" />
                Details ansehen
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {selectedTask && (
        <VendorTaskDetailDialog
          task={selectedTask}
          vendor={vendors.find(v => v.id === selectedTask.vendor_id)}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}