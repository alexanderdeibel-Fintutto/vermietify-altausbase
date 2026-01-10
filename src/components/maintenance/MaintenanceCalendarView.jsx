import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const statusColors = {
  pending: 'bg-yellow-500',
  assigned: 'bg-blue-500',
  in_progress: 'bg-purple-500',
  completed: 'bg-green-500',
  cancelled: 'bg-slate-500'
};

export default function MaintenanceCalendarView({ buildingId }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: tasks = [] } = useQuery({
    queryKey: ['maintenance-calendar', buildingId, currentDate.getMonth()],
    queryFn: async () => {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const allTasks = await base44.entities.MaintenanceTask.list('-scheduled_date', 500);
      
      return allTasks.filter(task => {
        if (buildingId && task.building_id !== buildingId) return false;
        if (!task.scheduled_date) return false;
        const taskDate = new Date(task.scheduled_date);
        return taskDate >= startOfMonth && taskDate <= endOfMonth;
      });
    }
  });

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const getTasksForDay = (day) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.scheduled_date);
      return taskDate.getDate() === day &&
             taskDate.getMonth() === currentDate.getMonth() &&
             taskDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const today = new Date();
  const isToday = (day) => {
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Wartungskalender</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[150px] text-center">
              {currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-slate-600 p-2">
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="p-2 min-h-[100px]" />
          ))}

          {/* Days of month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const dayTasks = getTasksForDay(day);
            
            return (
              <div
                key={day}
                className={`p-2 min-h-[100px] border rounded-lg ${
                  isToday(day) ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200'
                }`}
              >
                <div className={`text-sm font-semibold mb-2 ${
                  isToday(day) ? 'text-blue-600' : 'text-slate-700'
                }`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayTasks.map(task => (
                    <div
                      key={task.id}
                      className="text-xs p-1 rounded border-l-2 bg-slate-50"
                      style={{ borderLeftColor: statusColors[task.status] }}
                      title={task.title}
                    >
                      <p className="truncate font-medium">{task.title}</p>
                      <p className="text-[10px] text-slate-600 truncate">
                        {task.assigned_to || 'Nicht zugewiesen'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${color}`} />
              <span className="capitalize">{status}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}