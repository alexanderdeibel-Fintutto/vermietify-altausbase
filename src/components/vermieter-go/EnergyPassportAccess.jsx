import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, Download, Eye } from 'lucide-react';

export default function EnergyPassportAccess({ buildingId }) {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(null, 100)
  });

  const building = buildingId ? buildings.find(b => b.id === buildingId) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Energieausweis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {building && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="font-semibold text-sm mb-2">{building.name}</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Baujahr:</span>
                <span className="font-semibold">{building.construction_year || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Energieklasse:</span>
                <Badge className="bg-green-600">A+</Badge>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="flex-1">
                <Eye className="w-3 h-3 mr-1" />
                Anzeigen
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}