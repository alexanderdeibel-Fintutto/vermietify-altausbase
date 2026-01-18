import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function TaskCalendar({ tasks = [] }) {
  const getDaysInMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  };

  const days = getDaysInMonth();
  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Aufgabenkalender
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-[var(--theme-text-muted)] p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const hasTasks = tasks.some(t => {
              if (!t.faelligkeitsdatum) return false;
              const taskDate = new Date(t.faelligkeitsdatum);
              return taskDate.getDate() === day;
            });

            return (
              <div 
                key={day}
                className={`aspect-square p-2 text-center rounded-md text-sm ${
                  hasTasks 
                    ? 'bg-[var(--theme-primary)] text-white font-bold' 
                    : 'bg-[var(--theme-surface)] text-[var(--theme-text-primary)]'
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}