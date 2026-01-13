import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function QuickStatsGrid({ stats = [] }) {
  if (!stats || stats.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, idx) => (
        <Card key={idx} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              {stat.change && (
                <div className={`flex items-center gap-1 mt-2 text-xs ${stat.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stat.change > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(stat.change)}% vs. Vorperiode
                </div>
              )}
            </div>
            {stat.icon && (
              <div className="text-2xl">{stat.icon}</div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}