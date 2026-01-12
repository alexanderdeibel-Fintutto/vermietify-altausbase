import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SOLLBookingCard({ booking, children }) {
  return (
    <Card className="border-dashed border-2 border-slate-300 bg-slate-50 hover:border-slate-400 transition-colors">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <Badge variant="outline" className="bg-slate-100 text-slate-700">
            📋 SOLL (Geplant)
          </Badge>
          {booking?.status && <span className="text-xs text-slate-600">{booking.status}</span>}
        </div>
        {children}
      </div>
    </Card>
  );
}