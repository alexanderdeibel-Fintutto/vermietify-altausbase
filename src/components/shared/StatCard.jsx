import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function StatCard({ title, value, icon: Icon, color = 'blue', trend, subtitle }) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    emerald: 'text-emerald-600'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm text-slate-600">{title}</div>
            <div className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</div>
            {subtitle && (
              <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
            )}
            {trend && (
              <div className={`text-xs mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </div>
            )}
          </div>
          {Icon && (
            <Icon className={`w-10 h-10 ${colorClasses[color]} opacity-20`} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}