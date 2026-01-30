import React from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay } from 'date-fns';

export default function CalendarHeatmap({ data = {}, month = new Date() }) {
  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month)
  });

  const startDayOfWeek = getDay(startOfMonth(month));

  const getIntensity = (date) => {
    const key = format(date, 'yyyy-MM-dd');
    const value = data[key] || 0;
    
    if (value === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (value < 3) return 'bg-green-200';
    if (value < 5) return 'bg-green-400';
    if (value < 8) return 'bg-green-600';
    return 'bg-green-800';
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-7 gap-1">
        {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-xs text-center text-gray-500 font-medium mb-1">
            {day}
          </div>
        ))}
        
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        
        {days.map(day => {
          const value = data[format(day, 'yyyy-MM-dd')] || 0;
          return (
            <div
              key={day}
              className={`aspect-square rounded ${getIntensity(day)} transition-all hover:scale-110 cursor-pointer relative group`}
              title={`${format(day, 'dd.MM.yyyy')}: ${value}`}
            >
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {format(day, 'dd.MM')}: {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}