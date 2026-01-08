import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle, trend }) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    emerald: 'text-emerald-600',
    yellow: 'text-yellow-600'
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-600">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <p className={cn("text-xs mt-1", trend > 0 ? 'text-green-600' : 'text-red-600')}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </p>
            )}
          </div>
          {Icon && <Icon className={cn("w-8 h-8", colorClasses[color])} />}
        </div>
      </CardContent>
    </Card>
  );
}