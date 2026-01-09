import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function MaintenanceTaskCard({ task, onEdit, onDelete, building, equipment }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  const daysUntilDue = task.due_date ? Math.ceil((new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  const taskTypeLabels = {
    inspection: '🔍 Inspektion',
    maintenance: '🔧 Wartung',
    repair: '🛠️ Reparatur',
    service: '📋 Service',
    cleaning: '🧹 Reinigung',
    other: '📝 Sonstiges'
  };

  const statusColors = {
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-700'
  };

  const priorityColors = {
    low: 'border-l-4 border-green-500',
    medium: 'border-l-4 border-yellow-500',
    high: 'border-l-4 border-orange-500',
    critical: 'border-l-4 border-red-500'
  };

  const priorityLabels = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
    critical: '🚨'
  };

  return (
    <Card className={`p-4 hover:shadow-md transition-shadow ${priorityColors[task.priority]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-light text-slate-900">{task.title}</h4>
            <Badge className={statusColors[task.status]}>
              {task.status === 'open' ? '📂' : task.status === 'in_progress' ? '⏳' : task.status === 'completed' ? '✅' : '❌'}
            </Badge>
            {isOverdue && (
              <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Überfällig
              </Badge>
            )}
          </div>

          {task.description && (
            <p className="text-sm font-light text-slate-600 mt-2">{task.description}</p>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3 text-xs">
            <div>
              <p className="text-slate-500 font-light">Typ</p>
              <p className="font-light text-slate-900">{taskTypeLabels[task.task_type]}</p>
            </div>

            <div>
              <p className="text-slate-500 font-light">Priorität</p>
              <p className="font-light text-slate-900">{priorityLabels[task.priority]} {task.priority}</p>
            </div>

            <div>
              <p className="text-slate-500 font-light">Gebäude</p>
              <p className="font-light text-slate-900">{building?.name || '—'}</p>
            </div>

            {equipment && (
              <div>
                <p className="text-slate-500 font-light">Gerät</p>
                <p className="font-light text-slate-900">{equipment.name}</p>
              </div>
            )}

            <div>
              <p className="text-slate-500 font-light">Fällig am</p>
              <p className={`font-light ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-900'}`}>
                {format(new Date(task.due_date), 'd. MMM yyyy', { locale: de })}
              </p>
            </div>

            {task.assigned_to && (
              <div>
                <p className="text-slate-500 font-light">Zugewiesen an</p>
                <p className="font-light text-slate-900 truncate">{task.assigned_to}</p>
              </div>
            )}

            {daysUntilDue !== null && (
              <div>
                <p className="text-slate-500 font-light">Verbleibend</p>
                <p className={`font-light ${daysUntilDue <= 3 ? 'text-red-600' : daysUntilDue <= 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} Tage überfällig` : daysUntilDue === 0 ? 'Heute' : `${daysUntilDue} Tage`}
                </p>
              </div>
            )}

            {task.estimated_duration_hours && (
              <div>
                <p className="text-slate-500 font-light">Geschätzte Dauer</p>
                <p className="font-light text-slate-900">{task.estimated_duration_hours}h</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          <Button
            onClick={() => onEdit(task)}
            size="icon"
            variant="ghost"
            className="text-slate-400 hover:text-blue-600"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => onDelete(task.id)}
            size="icon"
            variant="ghost"
            className="text-slate-400 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}