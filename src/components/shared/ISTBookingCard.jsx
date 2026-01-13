import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ISTBookingCard({ children, className, ...props }) {
  return (
    <Card className={cn('border-solid border-2 border-emerald-500 bg-emerald-50/50', className)} {...props}>
      <CardHeader className="pb-2">
        <Badge className="w-fit bg-emerald-600">✓ IST (Tatsächlich)</Badge>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}