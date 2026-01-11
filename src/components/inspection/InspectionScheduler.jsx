import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock } from 'lucide-react';

export default function InspectionScheduler({ companyId }) {
  const [buildingId, setBuildingId] = useState('');
  const [inspectionType, setInspectionType] = useState('general_condition');
  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const queryClient = useQueryClient();

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings', companyId],
    queryFn: () => base44.entities.Building.filter({ company_id: companyId })
  });

  const { data: scheduledInspections = [] } = useQuery({
    queryKey: ['scheduled-inspections', companyId],
    queryFn: () => base44.entities.BuildingInspection.filter({ 
      company_id: companyId,
      status: 'scheduled'
    }, 'inspection_date')
  });

  const scheduleMutation = useMutation({
    mutationFn: () =>
      base44.entities.BuildingInspection.create({
        building_id: buildingId,
        company_id: companyId,
        inspection_type: inspectionType,
        inspector_name: inspectorName,
        inspection_date: inspectionDate,
        status: 'scheduled'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-inspections'] });
      setBuildingId('');
      setInspectorName('');
      setInspectionDate('');
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Inspektion planen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={buildingId} onValueChange={setBuildingId}>
            <SelectTrigger>
              <SelectValue placeholder="Gebäude auswählen" />
            </SelectTrigger>
            <SelectContent>
              {buildings.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name || b.address?.street}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={inspectionType} onValueChange={setInspectionType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fire_safety">Brandschutz</SelectItem>
              <SelectItem value="general_condition">Allgemeinzustand</SelectItem>
              <SelectItem value="energy_efficiency">Energieeffizienz</SelectItem>
              <SelectItem value="hvac">Heizung & Lüftung</SelectItem>
              <SelectItem value="electrical">Elektrik</SelectItem>
              <SelectItem value="plumbing">Sanitär</SelectItem>
              <SelectItem value="structural">Bausubstanz</SelectItem>
              <SelectItem value="annual_review">Jahresinspektion</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={inspectionDate}
            onChange={(e) => setInspectionDate(e.target.value)}
          />

          <Input
            placeholder="Inspektor Name"
            value={inspectorName}
            onChange={(e) => setInspectorName(e.target.value)}
          />

          <Button
            onClick={() => scheduleMutation.mutate()}
            disabled={!buildingId || !inspectionDate || scheduleMutation.isPending}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Inspektion planen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Geplante Inspektionen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {scheduledInspections.length === 0 ? (
            <p className="text-center text-slate-600 py-4">Keine geplanten Inspektionen</p>
          ) : (
            scheduledInspections.map(insp => {
              const building = buildings.find(b => b.id === insp.building_id);
              return (
                <div key={insp.id} className="p-3 border rounded">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{building?.name || 'Gebäude'}</h4>
                      <p className="text-xs text-slate-600">{insp.inspection_type}</p>
                    </div>
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(insp.inspection_date).toLocaleDateString('de-DE')}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">Inspektor: {insp.inspector_name}</p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}