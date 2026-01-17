import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfProgress } from '@/components/shared/VfProgress';
import { Home } from 'lucide-react';

export default function OccupancyWidget() {
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.filter({ status: 'active' })
  });

  const occupiedCount = contracts.length;
  const totalUnits = units.length;
  const occupancyRate = totalUnits > 0 ? (occupiedCount / totalUnits) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Auslastung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-[var(--theme-primary)]">
            {Math.round(occupancyRate)}%
          </div>
          <div className="text-sm text-[var(--theme-text-muted)] mt-1">
            {occupiedCount} von {totalUnits} Einheiten vermietet
          </div>
        </div>
        <VfProgress 
          value={occupancyRate} 
          max={100} 
          variant={occupancyRate >= 90 ? 'success' : 'default'}
          showValue={false}
        />
      </CardContent>
    </Card>
  );
}