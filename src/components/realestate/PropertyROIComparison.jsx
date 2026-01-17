import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp } from 'lucide-react';
import PercentageDisplay from '@/components/shared/PercentageDisplay';

export default function PropertyROIComparison() {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const buildingsWithROI = buildings.map(b => ({
    ...b,
    roi: ((b.annual_rent || 0) / (b.purchase_price || 1)) * 100
  })).sort((a, b) => b.roi - a.roi);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          ROI-Vergleich
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {buildingsWithROI.slice(0, 5).map((building) => (
            <div key={building.id} className="flex items-center justify-between p-3 bg-[var(--theme-surface)] rounded-lg">
              <span className="text-sm font-medium">{building.name}</span>
              <PercentageDisplay value={building.roi} className="font-bold text-[var(--vf-success-600)]" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}