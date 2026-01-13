import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ISTBookingCard({ title, amount, date, description, children, className = '' }) {
  return (
    <Card className={`border-solid border-2 border-emerald-500 bg-emerald-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="default" className="bg-emerald-600">
            ✓ IST (tatsächlich)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {amount && <div className="text-2xl font-bold text-emerald-700">€{amount.toFixed(2)}</div>}
        {date && <p className="text-sm text-emerald-600">Zahlgang: {date}</p>}
        {description && <p className="text-sm text-emerald-600">{description}</p>}
        {children}
      </CardContent>
    </Card>
  );
}