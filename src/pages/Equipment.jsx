import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import EquipmentTable from '@/components/equipment/EquipmentTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Equipment() {
  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list()
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Ausstattung & Anlagen"
        subtitle={`${equipment.length} Anlagen`}
        actions={
          <Button variant="gradient">
            <Plus className="h-4 w-4 mr-2" />
            Neue Anlage
          </Button>
        }
      />

      <div className="mt-6">
        <EquipmentTable equipment={equipment} onView={(item) => console.log(item)} />
      </div>
    </div>
  );
}