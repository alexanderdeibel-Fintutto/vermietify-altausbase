import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BuildingsWidget() {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-widget'],
    queryFn: () => base44.entities.Building.list('-updated_date', 10)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Gebäude
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {buildings.slice(0, 5).map(building => (
            <Link key={building.id} to={createPageUrl('BuildingDetail') + `?id=${building.id}`}>
              <div className="p-2 border rounded hover:bg-slate-50">
                <p className="text-sm font-semibold">{building.name}</p>
                <p className="text-xs text-slate-600">{building.city}</p>
              </div>
            </Link>
          ))}
          {buildings.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">Keine Gebäude</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}