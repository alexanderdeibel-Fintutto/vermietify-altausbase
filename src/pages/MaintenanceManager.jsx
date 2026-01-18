import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { VfModal } from '@/components/shared/VfModal';
import MaintenanceTaskForm from '@/components/maintenance/MaintenanceTaskForm';
import MaintenanceTaskCard from '@/components/maintenance/MaintenanceTaskCard';
import { Plus } from 'lucide-react';

export default function MaintenanceManager() {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: tasks = [] } = useQuery({
    queryKey: ['maintenance-tasks'],
    queryFn: () => base44.entities.Task.filter({ kategorie: 'Reparatur' })
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Wartung & Reparaturen"
        subtitle={`${tasks.length} aktive Aufgaben`}
        actions={
          <Button variant="gradient" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Aufgabe
          </Button>
        }
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {tasks.map((task) => (
          <MaintenanceTaskCard key={task.id} task={task} />
        ))}
      </div>

      <VfModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Wartungsaufgabe erstellen"
      >
        <MaintenanceTaskForm onSubmit={() => setCreateOpen(false)} />
      </VfModal>
    </div>
  );
}