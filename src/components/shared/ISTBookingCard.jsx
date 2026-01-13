import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ISTBookingCard({ title, amount, description, children, ...props }) {
  return (
    <Card 
      className="border-solid border-2 border-emerald-500 bg-emerald-50 hover:border-emerald-600 transition-colors"
      {...props}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge className="bg-emerald-600 hover:bg-emerald-700">
            ✓ IST (tatsächlich)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {amount && (
          <div className="text-2xl font-semibold text-emerald-900">
            {typeof amount === 'string' ? amount : `€${amount?.toFixed(2)}`}
          </div>
        )}
        {description && (
          <p className="text-sm text-emerald-700">{description}</p>
        )}
        {children}
      </CardContent>
    </Card>
  );
}