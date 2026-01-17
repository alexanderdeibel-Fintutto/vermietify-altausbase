import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import MaintenanceTaskCard from '@/components/maintenance/MaintenanceTaskCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function MaintenanceManager() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['maintenance-tasks'],
    queryFn: () => base44.entities.MaintenanceTask.list()
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Wartung & Instandhaltung"
        subtitle={`${tasks.length} Aufgaben`}
        actions={
          <Button variant="gradient">
            <Plus className="h-4 w-4 mr-2" />
            Neue Aufgabe
          </Button>
        }
      />

      <div className="grid gap-4 mt-6">
        {tasks.map((task) => (
          <MaintenanceTaskCard 
            key={task.id} 
            task={task}
            onClick={() => console.log('Task clicked:', task)}
          />
        ))}
      </div>
    </div>
  );
}