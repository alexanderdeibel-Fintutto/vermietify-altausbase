import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function HeatmapWidget({ data = [], title = 'Activity Heatmap' }) {
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getIntensity = (day, hour) => {
    const activity = data.find(d => d.day === day && d.hour === hour);
    return activity?.count || 0;
  };

  const maxCount = Math.max(...data.map(d => d.count || 0), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(24, 1fr)` }}>
              <div />
              {hours.map(hour => (
                <div key={hour} className="text-xs text-center text-[var(--theme-text-muted)]">
                  {hour}
                </div>
              ))}
              
              {days.map((day, dayIndex) => (
                <React.Fragment key={day}>
                  <div className="text-xs text-[var(--theme-text-muted)] flex items-center pr-2">
                    {day}
                  </div>
                  {hours.map(hour => {
                    const intensity = getIntensity(dayIndex, hour);
                    const opacity = maxCount > 0 ? intensity / maxCount : 0;
                    return (
                      <div
                        key={hour}
                        className="aspect-square rounded"
                        style={{
                          backgroundColor: `rgba(30, 58, 138, ${opacity})`,
                          minWidth: '20px'
                        }}
                        title={`${day} ${hour}:00 - ${intensity} activities`}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }