import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function QuickStatsGrid({ 
  stats = [],
  columns = 4 
}) {
  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
  }[columns] || 'grid-cols-4';

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {stats.map((stat, idx) => (
        <Card key={idx} className="border-slate-100">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {stat.value}
              </span>
              {stat.trend && (
                <div className={`flex items-center gap-0.5 text-xs ${
                  stat.trend > 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {stat.trend > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(stat.trend)}%
                </div>
              )}
            </div>
            {stat.description && (
              <p className="text-xs text-slate-500 mt-2">{stat.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}