import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import PlanComparisonTable from './PlanComparisonTable';
import { Package } from 'lucide-react';

export default function PlanComparisonCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Tarife im Vergleich
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PlanComparisonTable />
      </CardContent>
    </Card>
  );
}