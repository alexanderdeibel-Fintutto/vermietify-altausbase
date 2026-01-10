import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home } from 'lucide-react';

export default function OccupancyWidget() {
  const { data: units = [] } = useQuery({
    queryKey: ['units-occupancy'],
    queryFn: () => base44.entities.Unit.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-occupancy'],
    queryFn: () => base44.entities.LeaseContract.filter({ status: 'active' })
  });

  const occupiedUnits = contracts.filter(c => c.unit_id).length;
  const totalUnits = units.length;
  const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Home className="w-5 h-5" />
          Vermietungsstand
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <p className="text-4xl font-bold text-blue-600">{occupancyRate}%</p>
          <p className="text-sm text-slate-600 mt-1">{occupiedUnits} / {totalUnits} Einheiten</p>
        </div>
      </CardContent>
    </Card>
  );
}