import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfDatePicker } from '@/components/shared/VfDatePicker';
import SearchableSelect from '@/components/shared/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function InspectionScheduler() {
  const [formData, setFormData] = useState({
    building_id: '',
    inspection_date: '',
    inspector: ''
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const buildingOptions = buildings.map(b => ({ value: b.id, label: b.name }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Besichtigung planen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <SearchableSelect
            label="Objekt"
            options={buildingOptions}
            value={formData.building_id}
            onChange={(v) => setFormData({ ...formData, building_id: v })}
          />

          <VfDatePicker
            label="Datum"
            value={formData.inspection_date}
            onChange={(v) => setFormData({ ...formData, inspection_date: v })}
          />

          <Button variant="gradient" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Besichtigung anlegen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}