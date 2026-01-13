import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function SOLLBookingCard({ children, className, ...props }) {
  return (
    <Card className={cn('border-dashed border-2 border-slate-300 bg-slate-50/50', className)} {...props}>
      <CardHeader className="pb-2">
        <Badge variant="outline" className="w-fit">📋 SOLL (Geplant)</Badge>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}