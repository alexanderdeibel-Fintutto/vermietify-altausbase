import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import MaintenanceTaskForm from '@/components/maintenance/MaintenanceTaskForm';
import MaintenanceTaskCard from '@/components/maintenance/MaintenanceTaskCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

export default function MaintenanceTasks() {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssigned, setFilterAssigned] = useState('');
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['maintenanceTasks'],
    queryFn: () => base44.entities.MaintenanceTask.list('-due_date', 100),
  });

  // Fetch related entities
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list('-updated_date', 50),
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list('-updated_date', 100),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-updated_date', 50),
  });

  // Create/Update task
  const createMutation = useMutation({
    mutationFn: (data) => {
      if (editingTask) {
        return base44.entities.MaintenanceTask.update(editingTask.id, data);
      }
      return base44.entities.MaintenanceTask.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTasks'] });
      setShowForm(false);
      setEditingTask(null);
    },
  });

  // Delete task
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MaintenanceTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTasks'] });
    },
  });

  // Filter and search
  const filtered = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = !searchQuery ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !filterStatus || task.status === filterStatus;
      const matchesBuilding = !filterBuilding || task.building_id === filterBuilding;
      const matchesPriority = !filterPriority || task.priority === filterPriority;
      const matchesAssigned = !filterAssigned || task.assigned_to === filterAssigned;

      return matchesSearch && matchesStatus && matchesBuilding && matchesPriority && matchesAssigned;
    });
  }, [tasks, searchQuery, filterStatus, filterBuilding, filterPriority, filterAssigned]);

  // Stats
  const stats = {
    total: tasks.length,
    open: tasks.filter(t => t.status === 'open').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    overdue: tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < new Date();
    }).length,
    completed_today: tasks.filter(t => {
      if (t.status !== 'completed' || !t.completed_date) return false;
      const today = new Date();
      const completed = new Date(t.completed_date);
      return completed.toDateString() === today.toDateString();
    }).length,
  };

  // Group tasks
  const upcomingTasks = filtered.filter(t => {
    if (t.status === 'completed') return false;
    if (!t.due_date) return true;
    return new Date(t.due_date) >= new Date();
  }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const overdueTasks = filtered.filter(t => {
    if (t.status === 'completed') return false;
    if (!t.due_date) return false;
    return new Date(t.due_date) < new Date();
  }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const completedTasks = filtered.filter(t => t.status === 'completed');

  const buildingMap = buildings.reduce((acc, b) => {
    acc[b.id] = b;
    return acc;
  }, {});

  const equipmentMap = equipment.reduce((acc, e) => {
    acc[e.id] = e;
    return acc;
  }, {});

  const handleSubmit = (data) => {
    createMutation.mutate(data);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const assignedUsers = [...new Set(tasks.map(t => t.assigned_to).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Wartungs- & Serviceaufgaben</h1>
          <p className="text-slate-600 font-light mt-2">Verwalten Sie alle anstehenden und überfälligen Aufgaben</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 font-light gap-2"
        >
          <Plus className="w-4 h-4" />
          Neue Aufgabe
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="p-4">
          <p className="text-xs font-light text-slate-600">Insgesamt</p>
          <p className="text-2xl font-light text-slate-900 mt-1">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-light text-slate-600">Offen</p>
          <p className="text-2xl font-light text-blue-600 mt-1">📂 {stats.open}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-light text-slate-600">In Bearbeitung</p>
          <p className="text-2xl font-light text-yellow-600 mt-1">⏳ {stats.in_progress}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-light text-slate-600">Überfällig</p>
          <p className="text-2xl font-light text-red-600 mt-1">🚨 {stats.overdue}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-light text-slate-600">Heute erledigt</p>
          <p className="text-2xl font-light text-green-600 mt-1">✅ {stats.completed_today}</p>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <MaintenanceTaskForm
          task={editingTask}
          buildings={buildings}
          equipment={equipment}
          units={[]}
          users={users}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Nach Titel oder Beschreibung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 font-light"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle Status</SelectItem>
              <SelectItem value="open">📂 Offen</SelectItem>
              <SelectItem value="in_progress">⏳ In Bearbeitung</SelectItem>
              <SelectItem value="completed">✅ Abgeschlossen</SelectItem>
              <SelectItem value="cancelled">❌ Abgebrochen</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Priorität" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle Prioritäten</SelectItem>
              <SelectItem value="low">🟢 Niedrig</SelectItem>
              <SelectItem value="medium">🟡 Mittel</SelectItem>
              <SelectItem value="high">🔴 Hoch</SelectItem>
              <SelectItem value="critical">🚨 Kritisch</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterBuilding} onValueChange={setFilterBuilding}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Gebäude" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle Gebäude</SelectItem>
              {buildings.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterAssigned} onValueChange={setFilterAssigned}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Zugewiesen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle Benutzer</SelectItem>
              {assignedUsers.map(email => (
                <SelectItem key={email} value={email}>
                  {email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tasks */}
      <div className="space-y-6">
        {/* Überfällige Aufgaben */}
        {overdueTasks.length > 0 && (
          <div>
            <h2 className="text-xl font-light text-red-600 mb-3 flex items-center gap-2">
              🚨 Überfällige Aufgaben ({overdueTasks.length})
            </h2>
            <div className="space-y-2">
              {overdueTasks.map(task => (
                <MaintenanceTaskCard
                  key={task.id}
                  task={task}
                  building={buildingMap[task.building_id]}
                  equipment={task.equipment_id ? equipmentMap[task.equipment_id] : null}
                  onEdit={handleEdit}
                  onDelete={(id) => {
                    if (confirm('Diese Aufgabe wirklich löschen?')) {
                      deleteMutation.mutate(id);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Anstehende Aufgaben */}
        {upcomingTasks.length > 0 && (
          <div>
            <h2 className="text-xl font-light text-slate-900 mb-3 flex items-center gap-2">
              📅 Anstehende Aufgaben ({upcomingTasks.length})
            </h2>
            <div className="space-y-2">
              {upcomingTasks.map(task => (
                <MaintenanceTaskCard
                  key={task.id}
                  task={task}
                  building={buildingMap[task.building_id]}
                  equipment={task.equipment_id ? equipmentMap[task.equipment_id] : null}
                  onEdit={handleEdit}
                  onDelete={(id) => {
                    if (confirm('Diese Aufgabe wirklich löschen?')) {
                      deleteMutation.mutate(id);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Abgeschlossene Aufgaben */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-xl font-light text-slate-600 mb-3 flex items-center gap-2">
              ✅ Abgeschlossene Aufgaben ({completedTasks.length})
            </h2>
            <div className="space-y-2">
              {completedTasks.slice(0, 5).map(task => (
                <MaintenanceTaskCard
                  key={task.id}
                  task={task}
                  building={buildingMap[task.building_id]}
                  equipment={task.equipment_id ? equipmentMap[task.equipment_id] : null}
                  onEdit={handleEdit}
                  onDelete={(id) => {
                    if (confirm('Diese Aufgabe wirklich löschen?')) {
                      deleteMutation.mutate(id);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filtered.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-3xl">📋</p>
            <p className="text-slate-600 font-light mt-2">
              Keine Aufgaben gefunden. Erstellen Sie eine neue Aufgabe.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}