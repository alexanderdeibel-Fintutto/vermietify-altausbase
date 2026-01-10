import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Home, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function VacancyOverview({ buildingId }) {
  const { data: units = [] } = useQuery({
    queryKey: ['units', buildingId],
    queryFn: () => base44.entities.Unit.filter(
      buildingId ? { building_id: buildingId } : {},
      'unit_number',
      100
    )
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.filter({ status: 'active' }, null, 100)
  });

  const vacantUnits = units.filter(unit => 
    !contracts.find(c => c.unit_id === unit.id)
  );

  const { data: viewings = [] } = useQuery({
    queryKey: ['upcomingViewings'],
    queryFn: () => base44.entities.BuildingTask.filter(
      {
        task_type: 'administrative',
        task_title: { $regex: 'Besichtigung' },
        status: 'assigned'
      },
      'due_date',
      20
    )
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Home className="w-4 h-4" />
          Leerstand
          <Badge className="bg-orange-100 text-orange-800">{vacantUnits.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {vacantUnits.map(unit => {
          const unitViewings = viewings.filter(v => v.unit_id === unit.id);
          return (
            <div key={unit.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{unit.unit_number}</p>
                  <p className="text-xs text-slate-600">{unit.size_sqm} m²</p>
                </div>
                <Badge className="bg-orange-600">Frei</Badge>
              </div>
              {unitViewings.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <Calendar className="w-3 h-3" />
                  <span>{unitViewings.length} Besichtigungen geplant</span>
                </div>
              )}
            </div>
          );
        })}
        {vacantUnits.length === 0 && (
          <p className="text-center text-slate-600 py-4">Alle Einheiten vermietet</p>
        )}
      </CardContent>
    </Card>
  );
}