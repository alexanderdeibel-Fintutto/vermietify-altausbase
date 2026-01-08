import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TaskFilterBar from '@/components/tasks/TaskFilterBar';
import TaskListTable from '@/components/tasks/TaskListTable';
import QuickStats from '@/components/shared/QuickStats';

export default function TaskManagementPage() {
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task?.list?.() || []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setShowDialog(false); setFormData({}); }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.update(editingTask.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setShowDialog(false); setEditingTask(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const filteredTasks = tasks.filter(t => (t.title || '').toLowerCase().includes(search.toLowerCase()));
  const completedCount = tasks.filter(t => t.status === 'done').length;

  const stats = [
    { label: 'Gesamt-Aufgaben', value: tasks.length },
    { label: 'Offen', value: tasks.length - completedCount },
    { label: 'Erledigt', value: completedCount },
    { label: 'Diese Woche', value: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">✅ Aufgaben</h1>
        <p className="text-slate-600 mt-1">Verwalten Sie Ihre Aufgaben und Workflows</p>
      </div>
      <QuickStats stats={stats} accentColor="red" />
      <TaskFilterBar onSearchChange={setSearch} onNewTask={() => { setEditingTask(null); setFormData({}); setShowDialog(true); }} />
      <TaskListTable tasks={filteredTasks} onEdit={(t) => { setEditingTask(t); setFormData(t); setShowDialog(true); }} onDelete={(t) => deleteMutation.mutate(t.id)} onToggle={(t) => updateMutation.mutate({...t, status: t.status === 'done' ? 'open' : 'done'})} />
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTask ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Titel" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            <Input placeholder="Beschreibung" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            <Input placeholder="Fällig am" type="date" value={formData.due_date || ''} onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
              <Button onClick={() => editingTask ? updateMutation.mutate(formData) : createMutation.mutate(formData)} className="bg-red-600 hover:bg-red-700">Speichern</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}