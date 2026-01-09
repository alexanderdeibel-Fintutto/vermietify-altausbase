import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

export function StatTrend({ label, value, trend, percentage }) {
  return (
    <Card className="p-4 bg-white border border-slate-200">
      <p className="text-sm font-light text-slate-600 mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-2xl font-light text-slate-900">{value}</h3>
        <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="font-light">{percentage}%</span>
        </div>
      </div>
    </Card>
  );
}

export function LinkingCard({ title, source, links, action }) {
  return (
    <Card className="p-4 border border-slate-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-light text-slate-600 uppercase tracking-wider mb-1">{source}</p>
          <h4 className="font-light text-slate-900">{title}</h4>
        </div>
        <Badge className="bg-blue-100 text-blue-800 font-light text-xs">{links.length} Links</Badge>
      </div>
      <div className="space-y-2">
        {links.map((link, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm font-light text-slate-600">
            <span className="text-xs">→</span>
            <span>{link}</span>
          </div>
        ))}
      </div>
      {action && (
        <button className="mt-3 text-sm font-light text-blue-600 hover:text-blue-700 flex items-center gap-1">
          View Details <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </Card>
  );
}

export function AlertWidget({ priority, count, message }) {
  const bgColor = priority === 'critical' ? 'bg-red-50' : priority === 'high' ? 'bg-orange-50' : 'bg-yellow-50';
  const borderColor = priority === 'critical' ? 'border-red-200' : priority === 'high' ? 'border-orange-200' : 'border-yellow-200';
  const textColor = priority === 'critical' ? 'text-red-800' : priority === 'high' ? 'text-orange-800' : 'text-yellow-800';

  return (
    <Card className={`p-4 border ${bgColor} ${borderColor}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">
          {priority === 'critical' ? '🚨' : priority === 'high' ? '⚠️' : '⚡'}
        </span>
        <div className="flex-1">
          <p className={`font-light ${textColor}`}>{count} {priority.toUpperCase()} ALERTS</p>
          <p className={`text-sm font-light ${textColor} opacity-80`}>{message}</p>
        </div>
      </div>
    </Card>
  );
}