import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { VfModal } from '@/components/shared/VfModal';
import EquipmentForm from '@/components/equipment/EquipmentForm';
import EquipmentTable from '@/components/equipment/EquipmentTable';
import { Plus } from 'lucide-react';

export default function Equipment() {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list()
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Ausstattung & Anlagen"
        subtitle={`${equipment.length} Geräte erfasst`}
        actions={
          <Button variant="gradient" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Anlage
          </Button>
        }
      />

      <div className="mt-6">
        <EquipmentTable equipment={equipment} />
      </div>

      <VfModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Neue Anlage erfassen"
      >
        <EquipmentForm onSubmit={() => setCreateOpen(false)} />
      </VfModal>
    </div>
  );
}