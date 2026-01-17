import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import TaskStats from '@/components/tasks/TaskStats';
import TaskList from '@/components/tasks/TaskList';
import TaskCalendar from '@/components/tasks/TaskCalendar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function TaskManagement() {
  return (
    <div className="p-6">
      <PageHeader
        title="Aufgaben"
        subtitle="Verwalten Sie alle Ihre Aufgaben"
        actions={
          <Button variant="gradient">
            <Plus className="h-4 w-4 mr-2" />
            Neue Aufgabe
          </Button>
        }
      />

      <TaskStats />

      <div className="grid lg:grid-cols-[1fr_400px] gap-6 mt-6">
        <TaskList />
        <TaskCalendar />
      </div>
    </div>
  );
}