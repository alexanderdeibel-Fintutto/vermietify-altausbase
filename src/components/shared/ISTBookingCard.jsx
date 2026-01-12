import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ISTBookingCard({ booking, children }) {
  return (
    <Card className="border-solid border-2 border-emerald-500 bg-emerald-50 hover:border-emerald-600 transition-colors">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <Badge className="bg-emerald-600 text-white">
            ✓ IST (Tatsächlich)
          </Badge>
          {booking?.date && <span className="text-xs text-emerald-700">{new Date(booking.date).toLocaleDateString('de-DE')}</span>}
        </div>
        {children}
      </div>
    </Card>
  );
}