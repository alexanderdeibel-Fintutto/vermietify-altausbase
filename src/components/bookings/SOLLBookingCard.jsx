import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import HelpTooltip from '@/components/shared/HelpTooltip';

export default function SOLLBookingCard({ title, amount, description, children, ...props }) {
  return (
    <Card 
      className="border-dashed border-2 border-amber-300 bg-amber-50 hover:border-amber-400 transition-colors"
      {...props}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {title}
            <HelpTooltip text="SOLL-Buchung: Geplante Einnahme basierend auf Mietvertrag. Wird automatisch aus Verträgen generiert." />
          </CardTitle>
          <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
            📋 SOLL (geplant)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {amount && (
          <div className="text-2xl font-semibold text-amber-900">
            {typeof amount === 'string' ? amount : `€${amount?.toFixed(2)}`}
          </div>
        )}
        {description && (
          <p className="text-sm text-amber-700">{description}</p>
        )}
        {children}
      </CardContent>
    </Card>
  );
}