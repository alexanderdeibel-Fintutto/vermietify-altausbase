import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SOLLBookingCard({ title, amount, date, description, children }) {
  return (
    <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-slate-900">{title}</p>
            <p className="text-xs text-slate-600 mt-1">{description}</p>
          </div>
          <Badge variant="outline" className="text-xs">📋 SOLL</Badge>
        </div>
        <div className="flex items-baseline gap-2 mt-3">
          <p className="text-2xl font-bold text-slate-700">€{amount.toFixed(2)}</p>
          <p className="text-xs text-slate-500">{date}</p>
        </div>
        {children}
      </div>
    </Card>
  );
}