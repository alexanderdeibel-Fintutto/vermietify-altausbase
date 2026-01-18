import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function HeatmapWidget() {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  
  const getActivity = () => Math.floor(Math.random() * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Aktivitäts-Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-grid grid-cols-25 gap-1" style={{ gridTemplateColumns: 'auto repeat(24, 1fr)' }}>
            <div></div>
            {hours.map(h => (
              <div key={h} className="text-xs text-center text-[var(--theme-text-muted)]">{h}</div>
            ))}
            {days.map(day => (
              <React.Fragment key={day}>
                <div className="text-xs text-[var(--theme-text-muted)] pr-2">{day}</div>
                {hours.map(h => {
                  const activity = getActivity();
                  return (
                    <div 
                      key={`${day}-${h}`}
                      className="w-4 h-4 rounded-sm"
                      style={{ 
                        backgroundColor: `rgba(30, 58, 138, ${activity / 100})` 
                      }}
                      title={`${day} ${h}:00 - ${activity}%`}
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