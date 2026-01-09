import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default function DashboardMetricsWidget({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  const trendColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-slate-600'
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-light text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-light text-slate-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm font-light text-slate-600 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className={`w-4 h-4 ${trendColors[trend.direction]}`} />
              <span className={`text-xs font-light ${trendColors[trend.direction]}`}>
                {trend.text}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`${colors[color]} p-3 rounded-lg`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  );
}