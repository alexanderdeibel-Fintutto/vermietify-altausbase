import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SOLLBookingCard({ title, amount, date, description, children, className = '' }) {
  return (
    <Card className={`border-dashed border-2 border-slate-300 bg-slate-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="outline" className="bg-white text-slate-600">
            📋 SOLL (geplant)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {amount && <div className="text-2xl font-bold text-slate-700">€{amount.toFixed(2)}</div>}
        {date && <p className="text-sm text-slate-600">Termin: {date}</p>}
        {description && <p className="text-sm text-slate-600">{description}</p>}
        {children}
      </CardContent>
    </Card>
  );
}